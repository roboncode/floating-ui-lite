import { ComputePositionState, Middleware } from "../types";

import { getViewportDimensions } from "../core/getViewportDimensions";

interface SizeOptions {
  padding?: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  maintainAspectRatio?: boolean;
  apply?: (dimensions: { width: number; height: number }) => void;
}

/**
 * Size middleware that adjusts the dimensions of the floating element
 * to fit within the available space while maintaining aspect ratio if possible
 */
export function size(options: SizeOptions = {}): Middleware {
  return {
    name: "size",
    async fn(state: ComputePositionState) {
      // Skip processing if elements are not visible or not in viewport
      if (
        state.visibilityState &&
        (!state.visibilityState.isReferenceVisible ||
          !state.visibilityState.isFloatingVisible ||
          !state.visibilityState.isWithinViewport)
      ) {
        return {};
      }

      const { x, y, rects } = state;
      const {
        padding = 5,
        minWidth = 0,
        minHeight = 0,
        maxWidth = Infinity,
        maxHeight = Infinity,
        maintainAspectRatio = true,
      } = options;

      const viewport = getViewportDimensions();

      const availableWidth = Math.max(
        0,
        Math.min(viewport.width - x - padding, maxWidth),
      );
      const availableHeight = Math.max(
        0,
        Math.min(viewport.height - y - padding, maxHeight),
      );

      const originalAspectRatio = rects.floating.width / rects.floating.height;

      let newWidth = Math.max(
        minWidth,
        Math.min(rects.floating.width, availableWidth),
      );
      let newHeight = Math.max(
        minHeight,
        Math.min(rects.floating.height, availableHeight),
      );

      // Maintain aspect ratio if enabled and original dimensions are valid
      if (
        maintainAspectRatio &&
        rects.floating.width > 0 &&
        rects.floating.height > 0
      ) {
        // Adjust dimensions to maintain aspect ratio
        if (newWidth / newHeight > originalAspectRatio) {
          newWidth = newHeight * originalAspectRatio;
        } else {
          newHeight = newWidth / originalAspectRatio;
        }

        // Ensure dimensions are within bounds
        newWidth = Math.max(minWidth, Math.min(newWidth, availableWidth));
        newHeight = Math.max(minHeight, Math.min(newHeight, availableHeight));
      }

      // Only return data if dimensions changed
      if (
        Math.abs(newWidth - rects.floating.width) > 0.1 ||
        Math.abs(newHeight - rects.floating.height) > 0.1
      ) {
        return {
          middlewareData: {
            ...state.middlewareData,
            size: {
              width: newWidth,
              height: newHeight,
              aspectRatio: originalAspectRatio,
            },
          },
        };
      }

      return {};
    },
  };
}
