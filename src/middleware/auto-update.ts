import { ComputePositionState, Middleware } from "../types";

/**
 * AutoUpdate middleware that handles automatic position updates
 * for scroll events and position changes
 */
export function autoUpdate(): Middleware {
  return {
    name: "autoUpdate",
    async fn(state: ComputePositionState) {
      const reference = state.elements.reference;
      const floating = state.elements.floating;

      if (!reference || !floating) {
        return {};
      }

      // Calculate current scroll position
      const scrollX = window.scrollX || document.documentElement.scrollLeft;
      const scrollY = window.scrollY || document.documentElement.scrollTop;

      // Get current rects
      const currentReferenceRect = reference.getBoundingClientRect();
      const currentFloatingRect = floating.getBoundingClientRect();

      // For absolute positioning, we need to add scroll offset to the position
      if (state.strategy === "absolute") {
        return {
          x: currentReferenceRect.x + scrollX,
          y: currentReferenceRect.y + scrollY,
          middlewareData: {
            ...state.middlewareData,
            autoUpdate: {
              scrollX,
              scrollY,
              referenceRect: currentReferenceRect,
              floatingRect: currentFloatingRect,
            },
          },
        };
      }

      // For fixed positioning, just use the viewport-relative coordinates
      return {
        middlewareData: {
          ...state.middlewareData,
          autoUpdate: {
            scrollX,
            scrollY,
            referenceRect: currentReferenceRect,
            floatingRect: currentFloatingRect,
          },
        },
      };
    },
  };
}
