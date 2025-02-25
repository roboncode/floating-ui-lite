import { ComputePositionState, Middleware } from "../types";

import { getViewportDimensions } from "../utils/dom";

interface ShiftOptions {
  padding?: number;
}

/**
 * Shift middleware that moves the floating element to keep it within viewport bounds
 * while maintaining the same placement
 */
export function shift(options: ShiftOptions = {}): Middleware {
  return {
    name: "shift",
    async fn(state: ComputePositionState) {
      const { x, y, rects } = state;
      const { padding = 5 } = options;

      const viewport = getViewportDimensions();
      let shiftX = x;
      let shiftY = y;

      // Shift horizontally if needed
      if (x < padding) {
        shiftX = padding;
      } else if (x + rects.floating.width > viewport.width - padding) {
        shiftX = viewport.width - rects.floating.width - padding;
      }

      // Shift vertically if needed
      if (y < padding) {
        shiftY = padding;
      } else if (y + rects.floating.height > viewport.height - padding) {
        shiftY = viewport.height - rects.floating.height - padding;
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
