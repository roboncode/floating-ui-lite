import { getParentElements } from "../core/getParentElements";
import { getScrollParents } from "../core/getScrollParents";
import { isElementVisible } from "../core/isElementVisible";
import { isInViewport } from "../core/isInViewport";
import { isRootElement } from "../core/isRootElement";
import { throttle } from "./throttle";

const THROTTLE_INTERVAL = 10;

interface AutoUpdateOptions {
  ancestorScroll?: boolean;
  ancestorResize?: boolean;
  elementResize?: boolean;
  layoutShift?: boolean;
  animationFrame?: boolean;
}

const defaultOptions: AutoUpdateOptions = {
  ancestorScroll: true,
  ancestorResize: true,
  elementResize: true,
  layoutShift: true,
  animationFrame: false,
};

// Get unique elements from multiple arrays
const getUniqueElements = <T>(arrays: T[][]): T[] => {
  return [...new Set(arrays.flat())];
};

// Get unique scroll parents for both reference and floating elements
const getUniqueScrollParents = (
  reference: HTMLElement,
  floating: HTMLElement
): Element[] => {
  return getUniqueElements([
    getScrollParents(reference, document.body),
    getScrollParents(floating, document.body),
  ]);
};

// Get unique ancestors for both reference and floating elements
const getUniqueAncestors = (
  reference: HTMLElement,
  floating: HTMLElement
): Element[] => {
  return getUniqueElements([
    getParentElements(reference),
    getParentElements(floating),
  ]).filter((element) => !isRootElement(element));
};

// Setup scroll event listeners
const setupScrollListeners = (
  reference: HTMLElement,
  floating: HTMLElement,
  throttledUpdate: () => void
): (() => void) => {
  const onScroll = (event: Event) => {
    if (!isElementVisible(floating)) return;

    const target = event.target as Node;
    const scrollParents = getUniqueScrollParents(reference, floating);
    const isRootScroll =
      target === document.documentElement || target === document;
    const isRelevantScroll =
      isRootScroll || scrollParents.includes(target as Element);

    if (!isRelevantScroll) return;

    if (isRootScroll && !isInViewport(reference) && !isInViewport(floating))
      return;

    throttledUpdate();
  };

  const scrollParents = getUniqueScrollParents(reference, floating);

  window.addEventListener("scroll", onScroll, { passive: true, capture: true });
  scrollParents.forEach((ancestor) => {
    ancestor.addEventListener("scroll", onScroll, { passive: true });
  });

  return () => {
    window.removeEventListener("scroll", onScroll, { capture: true });
    scrollParents.forEach((ancestor) => {
      ancestor.removeEventListener("scroll", onScroll);
    });
  };
};

// Setup resize observers
const setupResizeObserver = (
  reference: HTMLElement,
  floating: HTMLElement,
  throttledUpdate: () => void,
  options: {
    ancestorResize?: boolean;
    elementResize?: boolean;
  }
): (() => void) => {
  const observer = new ResizeObserver(throttledUpdate);

  if (options.ancestorResize) {
    observer.observe(document.documentElement);
    const ancestors = getUniqueAncestors(reference, floating);
    ancestors.forEach((ancestor) => observer.observe(ancestor));
  }

  if (options.elementResize) {
    observer.observe(reference);
    observer.observe(floating);
  }

  return () => observer.disconnect();
};

// Setup layout shift observer
const setupLayoutShiftObserver = (
  reference: HTMLElement,
  throttledUpdate: () => void
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
  const resizeObserver = new ResizeObserver(throttledUpdate);

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

  return () => {
    mutationObserver.disconnect();
    resizeObserver.disconnect();
  };
};

export function autoUpdate(
  reference: HTMLElement,
  floating: HTMLElement,
  update: () => void | Promise<void>,
  options: AutoUpdateOptions = {}
): () => void {
  const mergedOptions = { ...defaultOptions, ...options };
  const throttledUpdate = throttle(update, THROTTLE_INTERVAL);
  const cleanupFns: Array<() => void> = [];

  if (mergedOptions.animationFrame) {
    let frameId: number;
    const updateOnFrame = () => {
      update();
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
      cleanupFns.push(setupLayoutShiftObserver(reference, throttledUpdate));
    }
  }

  return () => cleanupFns.forEach((fn) => fn());
}
