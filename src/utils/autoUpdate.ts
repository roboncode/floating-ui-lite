import { getScrollParents } from "../core/getScrollParents";
import { throttle } from "./throttle";

const THROTTLE_INTERVAL = 100;

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

function getResizeAncestors(element: Element): Element[] {
  const ancestors: Element[] = [];
  let current = element.parentElement;

  while (current) {
    ancestors.push(current);
    current = current.parentElement;
  }

  return ancestors;
}

export function autoUpdate(
  reference: HTMLElement,
  floating: HTMLElement,
  update: () => void | Promise<void>,
  options: AutoUpdateOptions = {}
): () => void {
  const mergedOptions = { ...defaultOptions, ...options };
  const throttledUpdate = throttle(update, THROTTLE_INTERVAL);
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

  // Get all ancestors for resize (we still want all ancestors for resize events)
  const referenceResizeAncestors = getResizeAncestors(reference);
  const floatingResizeAncestors = getResizeAncestors(floating);
  const resizeAncestors = [
    ...new Set([...referenceResizeAncestors, ...floatingResizeAncestors]),
  ];

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

  // Setup ancestor resize listeners (on all ancestors)
  if (mergedOptions.ancestorResize) {
    const onResize = () => throttledUpdate();
    resizeAncestors.forEach((ancestor) => {
      ancestor.addEventListener("resize", onResize, { passive: true });
    });
    cleanupFns.push(() => {
      resizeAncestors.forEach((ancestor) => {
        ancestor.removeEventListener("resize", onResize);
      });
    });
  }

  // Setup element resize observer
  if (mergedOptions.elementResize) {
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
