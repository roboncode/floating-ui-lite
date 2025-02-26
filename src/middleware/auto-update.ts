import { ComputePositionState, Middleware } from "../types";

/**
 * Checks if an element is scrollable
 */
function isScrollable(element: HTMLElement): boolean {
  const { overflow, overflowX, overflowY } = window.getComputedStyle(element);
  return /(auto|scroll|overlay)/.test(overflow + overflowX + overflowY);
}

/**
 * Gets all scrollable parent elements
 */
function getScrollableParents(element: Element): HTMLElement[] {
  const scrollableParents: HTMLElement[] = [];
  let parent = element.parentElement;

  while (parent) {
    if (isScrollable(parent)) {
      scrollableParents.push(parent);
    }
    parent = parent.parentElement;
  }

  return scrollableParents;
}

/**
 * AutoUpdate middleware that handles automatic position updates
 * Sets up listeners for scroll, resize, and mutation events
 * Cleans up listeners when no longer needed
 */
export function autoUpdate(): Middleware {
  return {
    name: "autoUpdate",
    async fn(state: ComputePositionState) {
      const { reference, floating } = state.elements;

      if (!reference || !floating) {
        return {};
      }

      const cleanup: Array<() => void> = [];

      // Ensure state.update exists before setting up listeners
      if (!state.update) {
        console.warn(
          "autoUpdate middleware requires state.update to be defined"
        );
        return {};
      }

      // Throttle updates to prevent excessive calculations
      let ticking = false;
      const update = () => {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(() => {
            if (state.update) {
              state.update();
            }
            ticking = false;
          });
        }
      };

      // Handle scroll events
      const handleScroll = () => update();

      // Handle resize events
      const handleResize = () => update();

      // Add window scroll listener
      window.addEventListener("scroll", handleScroll, { passive: true });
      cleanup.push(() => window.removeEventListener("scroll", handleScroll));

      // Add window resize listener
      window.addEventListener("resize", handleResize, { passive: true });
      cleanup.push(() => window.removeEventListener("resize", handleResize));

      // Add scroll listeners to scrollable parents
      const scrollableParents = getScrollableParents(reference);
      scrollableParents.forEach((parent) => {
        parent.addEventListener("scroll", handleScroll, { passive: true });
        cleanup.push(() => parent.removeEventListener("scroll", handleScroll));
      });

      // Watch for DOM mutations that might affect positioning
      const observer = new MutationObserver(update);
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true,
      });
      cleanup.push(() => observer.disconnect());

      // Store cleanup function
      state.cleanup = () => cleanup.forEach((fn) => fn());

      // Calculate initial position with scroll offset
      const scrollX = window.scrollX || document.documentElement.scrollLeft;
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      const referenceRect = reference.getBoundingClientRect();

      if (state.strategy === "absolute") {
        return {
          x: referenceRect.x + scrollX,
          y: referenceRect.y + scrollY,
          middlewareData: {
            ...state.middlewareData,
            autoUpdate: {
              scrollX,
              scrollY,
              referenceRect,
            },
          },
        };
      }

      return {
        middlewareData: {
          ...state.middlewareData,
          autoUpdate: {
            scrollX,
            scrollY,
            referenceRect,
          },
        },
      };
    },
  };
}
