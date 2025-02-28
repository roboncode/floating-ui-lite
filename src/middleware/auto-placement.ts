import { ComputePositionState, Middleware, Placement } from "../types";

import { computeInitialPosition } from "../core/computePosition";
import { getViewportDimensions } from "../core/getViewportDimensions";

interface AutoPlacementOptions {
  allowedPlacements?: Placement[];
  padding?: number;
}

/**
 * Gets the available space for a given state and placement
 */
function getAvailableSpace(
  state: ComputePositionState,
  placement: Placement,
): number {
  const position = computeInitialPosition(
    state.rects.reference,
    state.rects.floating,
    placement,
  );
  const testState = { ...state, ...position };

  const { x, y } = testState;
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

/**
 * AutoPlacement middleware that automatically chooses the placement with the most space
 */
export function autoPlacement(options: AutoPlacementOptions = {}): Middleware {
  return {
    name: "autoPlacement",
    async fn(state: ComputePositionState) {
      const { middlewareData } = state;

      // Skip expensive computations if hidden
      if (middlewareData.hide?.skipComputations) {
        return {};
      }

      const {
        allowedPlacements = [
          "top",
          "top-start",
          "top-end",
          "bottom",
          "bottom-start",
          "bottom-end",
          "left",
          "left-start",
          "left-end",
          "right",
          "right-start",
          "right-end",
        ],
        padding = 5,
      } = options;

      // If current placement has enough space and element is visible, keep it
      const currentSpace = getAvailableSpace(state, state.placement);
      if (
        currentSpace >= padding &&
        state.visibilityState?.isReferenceInView &&
        state.visibilityState?.isFloatingInView
      ) {
        return {};
      }

      // Find placement with most available space
      let bestPlacement = state.placement;
      let maxSpace = currentSpace;

      for (const placement of allowedPlacements) {
        const space = getAvailableSpace(state, placement);
        if (space > maxSpace) {
          maxSpace = space;
          bestPlacement = placement;
        }
      }

      if (bestPlacement !== state.placement) {
        const newPosition = computeInitialPosition(
          state.rects.reference,
          state.rects.floating,
          bestPlacement,
        );
        return {
          ...newPosition,
          placement: bestPlacement,
          middlewareData: {
            ...state.middlewareData,
            autoPlacement: {
              originalPlacement: state.placement,
              finalPlacement: bestPlacement,
              availableSpace: maxSpace,
            },
          },
        };
      }

      return {};
    },
  };
}
