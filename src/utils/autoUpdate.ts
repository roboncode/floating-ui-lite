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
  let resizeObserver: ResizeObserver | null = null;
  let mutationObserver: MutationObserver | null = null;
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

  // Setup resize observer for both ancestor and element resizes
  if (mergedOptions.ancestorResize || mergedOptions.elementResize) {
    const observer = new ResizeObserver(() => throttledUpdate());
    resizeObserver = observer;

    // Observe ancestors if needed
    if (mergedOptions.ancestorResize) {
      observer.observe(document.documentElement);
      ancestors.forEach((ancestor) => {
        observer.observe(ancestor);
      });
    }

    // Observe reference and floating if needed
    if (mergedOptions.elementResize) {
      observer.observe(reference);
      observer.observe(floating);
    }

    cleanupFns.push(() => {
      if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver = null;
      }
    });
  }

  // Setup layout shift observer using MutationObserver
  if (mergedOptions.layoutShift) {
    mutationObserver = new MutationObserver(() => throttledUpdate());

    // Observe the entire document for layout-affecting changes
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["style", "class"],
      characterData: false,
    });

    cleanupFns.push(() => {
      if (mutationObserver) {
        mutationObserver.disconnect();
        mutationObserver = null;
      }
    });
  }

  // Return cleanup function that handles all listeners and observers
  return () => {
    cleanupFns.forEach((fn) => fn());
  };
}
