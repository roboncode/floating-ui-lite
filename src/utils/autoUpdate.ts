import { getScrollParents } from "../core/getScrollParents";
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

export function autoUpdate(
  reference: HTMLElement,
  floating: HTMLElement,
  update: () => void | Promise<void>,
  options: AutoUpdateOptions = {}
): () => void {
  const mergedOptions = { ...defaultOptions, ...options };
  const throttledUpdate = throttle(() => {
    console.log("[autoUpdate] Update triggered");
    return update();
  }, THROTTLE_INTERVAL);
  let animationFrame: number | null = null;
  let resizeObserver: ResizeObserver | null = null;
  let intersectionObserver: IntersectionObserver | null = null;
  const cleanupFns: Array<() => void> = [];

  // Get scrollable ancestors using getScrollParents
  const referenceScrollParents = getScrollParents(reference, document.body);
  const floatingScrollParents = getScrollParents(floating, document.body);
  const scrollParents = [
    ...new Set([...referenceScrollParents, ...floatingScrollParents]),
  ];

  // Get all ancestors for resize observation
  const getAncestors = (element: Element): Element[] => {
    const ancestors: Element[] = [];
    let current = element.parentElement;
    while (current && current !== document.documentElement) {
      ancestors.push(current);
      current = current.parentElement;
    }
    return ancestors;
  };

  const referenceAncestors = getAncestors(reference);
  const floatingAncestors = getAncestors(floating);
  const ancestors = [...new Set([...referenceAncestors, ...floatingAncestors])];

  // Setup ancestor scroll listeners (only on scrollable ancestors)
  if (mergedOptions.ancestorScroll) {
    const onScroll = () => throttledUpdate();

    // Add window scroll listener
    window.addEventListener("scroll", onScroll, {
      passive: true,
      capture: true,
    });

    // Add scrollable ancestors listeners
    scrollParents.forEach((ancestor) => {
      ancestor.addEventListener("scroll", onScroll, { passive: true });
    });

    cleanupFns.push(() => {
      window.removeEventListener("scroll", onScroll, { capture: true });
      scrollParents.forEach((ancestor) => {
        ancestor.removeEventListener("scroll", onScroll);
      });
    });
  }

  // Setup ancestor resize listeners
  if (mergedOptions.ancestorResize) {
    // Use a single observer for all resize events (window + ancestors + elements)
    const resizeObserver = new ResizeObserver(() => throttledUpdate());

    // Observe all ancestors and the document element for window resizes
    resizeObserver.observe(document.documentElement);
    ancestors.forEach((ancestor) => {
      resizeObserver.observe(ancestor);
    });

    // If elementResize is also enabled, observe the reference and floating elements
    if (mergedOptions.elementResize) {
      resizeObserver.observe(reference);
      resizeObserver.observe(floating);
    }

    cleanupFns.push(() => {
      resizeObserver.disconnect();
    });
  }
  // Only setup separate element resize observer if ancestorResize is false
  else if (mergedOptions.elementResize) {
    resizeObserver = new ResizeObserver(() => throttledUpdate());
    resizeObserver.observe(reference);
    resizeObserver.observe(floating);
    cleanupFns.push(() => {
      if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver = null;
      }
    });
  }

  // Setup layout shift observer
  if (mergedOptions.layoutShift) {
    intersectionObserver = new IntersectionObserver(() => throttledUpdate());
    intersectionObserver.observe(reference);
    cleanupFns.push(() => {
      if (intersectionObserver) {
        intersectionObserver.disconnect();
        intersectionObserver = null;
      }
    });
  }

  // Setup animation frame updates
  if (mergedOptions.animationFrame) {
    const startLoop = async () => {
      await throttledUpdate();
      animationFrame = requestAnimationFrame(startLoop);
    };
    startLoop();
    cleanupFns.push(() => {
      if (animationFrame !== null) {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
      }
    });
  }

  // Return cleanup function that handles all listeners and observers
  return () => {
    cleanupFns.forEach((fn) => fn());
  };
}
