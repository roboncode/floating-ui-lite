import { ComputePositionState, Middleware, Placement } from "../types";

import { computeInitialPosition } from "../core/computePosition";
import { getViewportDimensions } from "../core/getViewportDimensions";

interface PlacementOptions {
  fallbackPlacements?: Placement[];
  padding?: number;
}

/**
 * Placement middleware that handles positioning the floating element
 * and provides fallback placements if the primary placement doesn't fit
 */
export function placement(options: PlacementOptions = {}): Middleware {
  return {
    name: "placement",
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

      const { placement } = state;
      const { fallbackPlacements = [], padding = 5 } = options;

      // Calculate initial position
      const initialPosition = computeInitialPosition(
        state.rects.reference,
        state.rects.floating,
        placement
      );
      const initialState = { ...state, ...initialPosition };

      // Check if current placement fits
      if (fitsInViewport(initialState, padding)) {
        return {};
      }

      // Try fallback placements in order
      for (const fallbackPlacement of fallbackPlacements) {
        const fallbackPosition = computeInitialPosition(
          state.rects.reference,
          state.rects.floating,
          fallbackPlacement
        );
        const testState = { ...state, ...fallbackPosition };

        // Check if fallback placement fits
        if (fitsInViewport(testState, padding)) {
          return {
            ...fallbackPosition,
            placement: fallbackPlacement,
            middlewareData: {
              ...state.middlewareData,
              placement: {
                originalPlacement: placement,
                finalPlacement: fallbackPlacement,
              },
            },
          };
        }
      }

      // If no placement fits, try to find the best placement
      const allPlacements = [placement, ...fallbackPlacements];
      let bestPlacement = placement;
      let bestSpace = -Infinity;
      let bestPosition = initialPosition;

      for (const testPlacement of allPlacements) {
        const testPosition = computeInitialPosition(
          state.rects.reference,
          state.rects.floating,
          testPlacement
        );
        const testState = { ...state, ...testPosition };
        const space = getAvailableSpace(testState);

        if (space > bestSpace) {
          bestSpace = space;
          bestPlacement = testPlacement;
          bestPosition = testPosition;
        }
      }

      return {
        ...bestPosition,
        placement: bestPlacement,
        middlewareData: {
          ...state.middlewareData,
          placement: {
            originalPlacement: placement,
            finalPlacement: bestPlacement,
          },
        },
      };
    },
  };
}

/**
 * Checks if the floating element fits in the viewport with current placement
 */
function fitsInViewport(
  state: ComputePositionState,
  padding: number = 0
): boolean {
  const { x, y } = state;
  const { floating } = state.rects;
  const viewport = getViewportDimensions();

  return (
    x >= padding &&
    y >= padding &&
    x + floating.width <= viewport.width - padding &&
    y + floating.height <= viewport.height - padding
  );
}

/**
 * Calculates the available space for a given state
 */
function getAvailableSpace(state: ComputePositionState): number {
  const { x, y } = state;
  const { floating } = state.rects;
  const viewport = getViewportDimensions();

  // Calculate distances to viewport edges
  const top = y;
  const right = viewport.width - (x + floating.width);
  const bottom = viewport.height - (y + floating.height);
  const left = x;

  // Return minimum available space
  return Math.min(top, right, bottom, left);
}
