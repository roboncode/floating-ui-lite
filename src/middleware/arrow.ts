import { ComputePositionState, Middleware } from "../types";

import { getBoundingClientRect } from "../core/getBoundingClientRect";

interface ArrowOptions {
  element: HTMLElement;
  padding?: number;
}

/**
 * Arrow middleware that positions an arrow element to point at the reference element
 */
export function arrow(options: ArrowOptions): Middleware {
  return {
    name: "arrow",
    fn: async (state: ComputePositionState) => {
      // Skip processing if elements are not visible or not in viewport
      if (
        state.visibilityState &&
        (!state.visibilityState.isReferenceVisible ||
          !state.visibilityState.isFloatingVisible ||
          !state.visibilityState.isReferenceInView ||
          !state.visibilityState.isFloatingInView)
      ) {
        return {};
      }

      const { element, padding = 0 } = options;
      const { x, y, placement, rects } = state;

      const arrowRect = getBoundingClientRect(element);
      const [mainAxis, crossAxis = "center"] = placement.split("-");
      const isVertical = ["top", "bottom"].includes(mainAxis);

      let arrowX = x;
      let arrowY = y;

      // Position the arrow along the main axis
      if (isVertical) {
        arrowX = x + (rects.floating.width - arrowRect.width) / 2;
        arrowY =
          mainAxis === "top" ? y + rects.floating.height : y - arrowRect.height;
      } else {
        arrowX =
          mainAxis === "left" ? x + rects.floating.width : x - arrowRect.width;
        arrowY = y + (rects.floating.height - arrowRect.height) / 2;
      }

      // Adjust arrow position based on cross axis alignment
      if (crossAxis === "start") {
        if (isVertical) {
          arrowX = x + padding;
        } else {
          arrowY = y + padding;
        }
      } else if (crossAxis === "end") {
        if (isVertical) {
          arrowX = x + rects.floating.width - arrowRect.width - padding;
        } else {
          arrowY = y + rects.floating.height - arrowRect.height - padding;
        }
      }

      // Ensure arrow stays within floating element bounds
      arrowX = Math.max(
        x + padding,
        Math.min(arrowX, x + rects.floating.width - arrowRect.width - padding)
      );
      arrowY = Math.max(
        y + padding,
        Math.min(arrowY, y + rects.floating.height - arrowRect.height - padding)
      );

      return {
        middlewareData: {
          ...state.middlewareData,
          arrow: {
            x: arrowX,
            y: arrowY,
            centerOffset: isVertical
              ? arrowX - (x + rects.floating.width / 2)
              : arrowY - (y + rects.floating.height / 2),
          },
        },
      };
    },
  };
}
