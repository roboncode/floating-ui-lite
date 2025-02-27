/**
 * Efficient auto-update system for floating UI positioning
 *
 * This module responds to DOM events affecting floating elements' positioning, using
 * a throttled update mechanism to prevent performance issues from rapid updates.
 *
 * Update Triggers:
 * - Scroll events
 * - Resize events
 * - Layout shifts
 * - Animation frames (optional)
 *
 * Throttling:
 * A shared throttled update function is used for all triggers except initial and
 * animation frame updates. This ensures only one update occurs within the throttle
 * interval (default: 10ms), preventing performance issues from close events.
 *
 * Example:
 * Within a 10ms window, multiple events (scroll, resize, layout shift) trigger a
 * single update after the window.
 *
 * Special Cases:
 * - Initial update: Immediate without throttling
 * - Animation frame updates: Uses requestAnimationFrame's timing
 */

import { AutoUpdateOptions, VisibilityState } from "../types";

import { computeVisibilityState } from "./computeVisibilityState";
import { getUniqueAncestors } from "../core/uniqueAncestors";
import { getUniqueScrollParents } from "../core/uniqueScrollParents";
import { throttle } from "./throttle";

// Define the interval for throttling updates
// This interval is used to limit the frequency of updates to prevent excessive computation
const THROTTLE_INTERVAL = 10;

// Default options for auto update
// These default options ensure that all types of updates are enabled by default
const defaultOptions: AutoUpdateOptions = {
  ancestorScroll: true, // Listen for scroll events on ancestors
  ancestorResize: true, // Listen for resize events on ancestors
  elementResize: true, // Listen for resize events on the reference and floating elements
  layoutShift: true, // Listen for layout shifts affecting the reference element
  animationFrame: false, // Use requestAnimationFrame for updates
};

// Function to setup scroll event listeners
// This function sets up event listeners for scroll events on the window and unique scroll parents of the reference and floating elements
const setupScrollListeners = (
  reference: HTMLElement,
  floating: HTMLElement,
  throttledUpdate: (state: VisibilityState) => void
): (() => void) => {
  const onScroll = (event: Event) => {
    const target = event.target as Node;
    const scrollParents = getUniqueScrollParents(reference, floating);
    const isRootScroll =
      target === document.documentElement || target === document;
    const isRelevantScroll =
      isRootScroll || scrollParents.includes(target as Element);

    if (!isRelevantScroll) return;

    throttledUpdate(computeVisibilityState(reference, floating));
  };

  const scrollParents = getUniqueScrollParents(reference, floating);

  // Add event listeners for scroll events
  window.addEventListener("scroll", onScroll, { passive: true, capture: true });
  scrollParents.forEach((ancestor) => {
    ancestor.addEventListener("scroll", onScroll, { passive: true });
  });

  // Function to cleanup event listeners
  return () => {
    window.removeEventListener("scroll", onScroll, { capture: true });
    scrollParents.forEach((ancestor) => {
      ancestor.removeEventListener("scroll", onScroll);
    });
  };
};

// Function to setup resize observers
// This function sets up ResizeObserver instances to listen for resize events on ancestors and the reference and floating elements
const setupResizeObserver = (
  reference: HTMLElement,
  floating: HTMLElement,
  throttledUpdate: (state: VisibilityState) => void,
  options: {
    ancestorResize?: boolean;
    elementResize?: boolean;
  }
): (() => void) => {
  const observer = new ResizeObserver(() => {
    throttledUpdate(computeVisibilityState(reference, floating));
  });

  // Observe resize events on ancestors if option is set
  if (options.ancestorResize) {
    observer.observe(document.documentElement);
    const ancestors = getUniqueAncestors(reference, floating);
    ancestors.forEach((ancestor) => observer.observe(ancestor));
  }

  // Observe resize events on the reference and floating elements if option is set
  if (options.elementResize) {
    observer.observe(reference);
    observer.observe(floating);
  }

  // Function to cleanup observer
  return () => observer.disconnect();
};

// Function to setup layout shift observer
// This function sets up MutationObserver and ResizeObserver instances to listen for layout shifts affecting the reference element
const setupLayoutShiftObserver = (
  reference: HTMLElement,
  floating: HTMLElement,
  throttledUpdate: (state: VisibilityState) => void
): (() => void) => {
  const getLayoutBoundary = (element: HTMLElement): HTMLElement => {
    let parent = element.parentElement;
    while (parent) {
      if (getComputedStyle(parent).position !== "static") return parent;
      parent = parent.parentElement;
    }
    return document.body;
  };

  const layoutBoundary = getLayoutBoundary(reference);
  const resizeObserver = new ResizeObserver(() => {
    throttledUpdate(computeVisibilityState(reference, floating));
  });

  const mutationObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          resizeObserver.observe(node as Element);
        }
      });
      mutation.removedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          resizeObserver.unobserve(node as Element);
        }
      });
    });
  });

  mutationObserver.observe(layoutBoundary, {
    childList: true,
    subtree: true,
  });

  resizeObserver.observe(layoutBoundary);
  layoutBoundary.querySelectorAll("*").forEach((element) => {
    resizeObserver.observe(element);
  });

  // Function to cleanup observers
  return () => {
    mutationObserver.disconnect();
    resizeObserver.disconnect();
  };
};

// Main autoUpdate function
// This function orchestrates the setup of event listeners and observers for auto-updating the visibility state
export function autoUpdate(
  reference: HTMLElement,
  floating: HTMLElement,
  update: (state: VisibilityState) => void | Promise<void>,
  options: AutoUpdateOptions = {}
): () => void {
  const mergedOptions = { ...defaultOptions, ...options };
  const throttledUpdate = throttle(async () => {
    await update(computeVisibilityState(reference, floating));
  }, THROTTLE_INTERVAL);
  const cleanupFns: Array<() => void> = [];

  // Initial visibility check
  update(computeVisibilityState(reference, floating));

  if (mergedOptions.animationFrame) {
    let frameId: number;
    const updateOnFrame = () => {
      update(computeVisibilityState(reference, floating));
      frameId = requestAnimationFrame(updateOnFrame);
    };
    frameId = requestAnimationFrame(updateOnFrame);
    cleanupFns.push(() => cancelAnimationFrame(frameId));
  } else {
    if (mergedOptions.ancestorScroll) {
      cleanupFns.push(
        setupScrollListeners(reference, floating, throttledUpdate)
      );
    }

    if (mergedOptions.ancestorResize || mergedOptions.elementResize) {
      cleanupFns.push(
        setupResizeObserver(reference, floating, throttledUpdate, {
          ancestorResize: mergedOptions.ancestorResize,
          elementResize: mergedOptions.elementResize,
        })
      );
    }

    if (mergedOptions.layoutShift) {
      cleanupFns.push(
        setupLayoutShiftObserver(reference, floating, throttledUpdate)
      );
    }
  }

  // Function to cleanup all event listeners and observers
  return () => cleanupFns.forEach((fn) => fn());
}
