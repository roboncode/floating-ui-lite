import { getParentElements } from "../core/getParentElements";
import { getScrollParents } from "../core/getScrollParents";
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
  ancestorScroll: false,
  ancestorResize: false,
  elementResize: false,
  layoutShift: false,
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
  const onScroll = () => throttledUpdate();
  const scrollParents = getUniqueScrollParents(reference, floating);

  // Add window scroll listener
  window.addEventListener("scroll", onScroll, {
    passive: true,
    capture: true,
  });

  // Add scrollable ancestors listeners
  scrollParents.forEach((ancestor) => {
    ancestor.addEventListener("scroll", onScroll, { passive: true });
  });

  // Return cleanup function
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
  const observer = new ResizeObserver(() => throttledUpdate());

  // Observe ancestors if needed
  if (options.ancestorResize) {
    observer.observe(document.documentElement);
    const ancestors = getUniqueAncestors(reference, floating);
    ancestors.forEach((ancestor) => {
      observer.observe(ancestor);
    });
  }

  // Observe reference and floating if needed
  if (options.elementResize) {
    observer.observe(reference);
    observer.observe(floating);
  }

  // Return cleanup function
  return () => observer.disconnect();
};

// Setup layout shift observer
const setupLayoutShiftObserver = (
  reference: HTMLElement,
  throttledUpdate: () => void
): (() => void) => {
  const observer = new MutationObserver(throttledUpdate);

  // Get all ancestor elements up to the root
  const ancestors = getParentElements(reference);

  // Observe each ancestor for changes that could affect layout
  ancestors.forEach((ancestor) => {
    observer.observe(ancestor, {
      childList: true, // Track child element changes
      subtree: false, // Don't track deep changes
      attributes: true, // Track attribute changes
      attributeFilter: ["class", "style"], // Only care about visual changes
    });
  });

  // Return cleanup function
  return () => observer.disconnect();
};

export function autoUpdate(
  reference: HTMLElement,
  floating: HTMLElement,
  update: () => void | Promise<void>,
  options: AutoUpdateOptions = {}
): () => void {
  const mergedOptions = { ...defaultOptions, ...options };
  console.log("[autoUpdate] Initialized with options:", mergedOptions);

  const throttledUpdate = throttle(() => {
    console.log("[autoUpdate] Running update");
    return update();
  }, THROTTLE_INTERVAL);

  const cleanupFns: Array<() => void> = [];

  if (mergedOptions.animationFrame) {
    console.log("[autoUpdate] Using requestAnimationFrame mode");
    let frameId: number;
    const updateOnFrame = () => {
      update();
      frameId = requestAnimationFrame(updateOnFrame);
    };
    frameId = requestAnimationFrame(updateOnFrame);
    cleanupFns.push(() => {
      console.log("[autoUpdate] Cleaning up RAF");
      cancelAnimationFrame(frameId);
    });
  } else {
    // Only set up other listeners if not using animationFrame
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

  return () => {
    console.log("[autoUpdate] Cleaning up all listeners and observers");
    cleanupFns.forEach((fn) => fn());
  };
}
