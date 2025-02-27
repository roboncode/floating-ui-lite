import { ComputePositionState, Middleware } from "../types";

import { getBoundingClientRect } from "../core/getBoundingClientRect";
import { getViewportDimensions } from "../core/getViewportDimensions";

interface ShiftOptions {
  mainAxis?: boolean;
  crossAxis?: boolean;
  padding?: number;
}

/**
 * Shift middleware that moves the floating element to keep it within viewport bounds
 * while maintaining the same placement. Supports both main and cross axis shifting.
 */
export function shift(options: ShiftOptions = {}): Middleware {
  return {
    name: "shift",
    fn: async (state: ComputePositionState) => {
      // Skip processing if elements are not visible or not in viewport
      if (
        state.visibilityState &&
        (!state.visibilityState.isReferenceVisible ||
          !state.visibilityState.isFloatingVisible ||
          !state.visibilityState.isWithinViewport)
      ) {
        return {};
      }

      const { x, y, placement, rects, elements } = state;
      const { mainAxis = true, crossAxis = false, padding = 5 } = options;

      const [basePlacement] = placement.split("-");
      const isVertical = ["top", "bottom"].includes(basePlacement);

      // Get viewport dimensions
      const viewport = getViewportDimensions();

      // Get container boundaries if container exists
      let containerRect = {
        x: 0,
        y: 0,
        width: viewport.width,
        height: viewport.height,
      };
      if (elements.container && elements.container instanceof HTMLElement) {
        containerRect = getBoundingClientRect(elements.container);
      }

      let shiftX = x;
      let shiftY = y;

      // Handle main axis shifting
      if (mainAxis) {
        if (isVertical) {
          // Vertical placement (top/bottom) - shift horizontally
          const leftSpace = x - containerRect.x;
          const rightSpace =
            containerRect.x + containerRect.width - (x + rects.floating.width);

          if (leftSpace < padding) {
            shiftX = containerRect.x + padding;
          } else if (rightSpace < padding) {
            shiftX =
              containerRect.x +
              containerRect.width -
              rects.floating.width -
              padding;
          }
        } else {
          // Horizontal placement (left/right) - shift vertically
          const topSpace = y - containerRect.y;
          const bottomSpace =
            containerRect.y +
            containerRect.height -
            (y + rects.floating.height);

          if (topSpace < padding) {
            shiftY = containerRect.y + padding;
          } else if (bottomSpace < padding) {
            shiftY =
              containerRect.y +
              containerRect.height -
              rects.floating.height -
              padding;
          }
        }
      }

      // Handle cross axis shifting
      if (crossAxis) {
        if (isVertical) {
          // Vertical placement (top/bottom) - shift vertically
          const topSpace = y - containerRect.y;
          const bottomSpace =
            containerRect.y +
            containerRect.height -
            (y + rects.floating.height);

          if (topSpace < padding) {
            shiftY = containerRect.y + padding;
          } else if (bottomSpace < padding) {
            shiftY =
              containerRect.y +
              containerRect.height -
              rects.floating.height -
              padding;
          }
        } else {
          // Horizontal placement (left/right) - shift horizontally
          const leftSpace = x - containerRect.x;
          const rightSpace =
            containerRect.x + containerRect.width - (x + rects.floating.width);

          if (leftSpace < padding) {
            shiftX = containerRect.x + padding;
          } else if (rightSpace < padding) {
            shiftX =
              containerRect.x +
              containerRect.width -
              rects.floating.width -
              padding;
          }
        }
      }

      // Return new coordinates if shifted
      if (shiftX !== x || shiftY !== y) {
        return {
          x: shiftX,
          y: shiftY,
          middlewareData: {
            ...state.middlewareData,
            shift: {
              x: shiftX - x,
              y: shiftY - y,
            },
          },
        };
      }

      return {};
    },
  };
}
