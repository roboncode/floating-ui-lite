import { ComputePositionState, Middleware, Placement } from "../../types";

import { getViewportDimensions } from "../../utils/dom";

export interface FlipOptions {
  padding?: number;
  fallbackPlacements?: Placement[];
}

const opposites: Record<string, string> = {
  top: "bottom",
  bottom: "top",
  left: "right",
  right: "left",
};

/**
 * Flip middleware that changes placement when there isn't enough space
 * in the current placement direction
 */
export function flip(options: FlipOptions = {}): Middleware {
  return {
    name: "flip",
    async fn(state: ComputePositionState) {
      const { placement } = state;
      const { padding = 5, fallbackPlacements = [] } = options;

      // If current placement fits, no need to flip
      if (fitsInViewport(state, padding)) {
        return {};
      }

      // Try opposite placement first
      const [mainAxis, crossAxis = ""] = placement.split("-");
      const oppositePlacement =
        `${opposites[mainAxis]}${crossAxis ? "-" + crossAxis : ""}` as Placement;

      // Calculate position for opposite placement
      const flippedState = computeFlippedPosition(state, oppositePlacement);

      // Check if opposite placement fits
      if (fitsInViewport(flippedState, padding)) {
        return {
          x: flippedState.x,
          y: flippedState.y,
          placement: oppositePlacement,
          middlewareData: {
            ...state.middlewareData,
            flip: {
              originalPlacement: placement,
              finalPlacement: oppositePlacement,
            },
          },
        };
      }

      // Try fallback placements if provided
      for (const fallbackPlacement of fallbackPlacements) {
        const fallbackState = computeFlippedPosition(state, fallbackPlacement);
        if (fitsInViewport(fallbackState, padding)) {
          return {
            x: fallbackState.x,
            y: fallbackState.y,
            placement: fallbackPlacement,
            middlewareData: {
              ...state.middlewareData,
              flip: {
                originalPlacement: placement,
                finalPlacement: fallbackPlacement,
              },
            },
          };
        }
      }

      // If no placement fits, use the one with the most available space
      const placements = [oppositePlacement, ...fallbackPlacements];
      let bestPlacement = oppositePlacement;
      let bestSpace = getAvailableSpace(flippedState);

      for (const testPlacement of placements) {
        const testState = computeFlippedPosition(state, testPlacement);
        const space = getAvailableSpace(testState);
        if (space > bestSpace) {
          bestSpace = space;
          bestPlacement = testPlacement;
        }
      }

      const finalState = computeFlippedPosition(state, bestPlacement);
      return {
        x: finalState.x,
        y: finalState.y,
        placement: bestPlacement,
        middlewareData: {
          ...state.middlewareData,
          flip: {
            originalPlacement: placement,
            finalPlacement: bestPlacement,
          },
        },
      };
    },
  };
}

/**
 * Checks if the floating element fits in the viewport with the given placement
 */
function fitsInViewport(
  state: ComputePositionState,
  padding: number = 0
): boolean {
  const { x, y, rects } = state;
  const viewport = getViewportDimensions();

  const floatingWidth = rects.floating.width;
  const floatingHeight = rects.floating.height;

  return (
    x >= padding &&
    y >= padding &&
    x + floatingWidth <= viewport.width - padding &&
    y + floatingHeight <= viewport.height - padding
  );
}

/**
 * Computes the position for a flipped placement
 */
function computeFlippedPosition(
  state: ComputePositionState,
  newPlacement: Placement
): ComputePositionState {
  const { rects } = state;
  const [mainAxis, crossAxis = "center"] = newPlacement.split("-");

  // Initialize at reference position
  let x = rects.reference.x;
  let y = rects.reference.y;

  // Calculate main axis position
  switch (mainAxis) {
    case "top":
      y = rects.reference.y - rects.floating.height;
      break;
    case "bottom":
      y = rects.reference.y + rects.reference.height;
      break;
    case "left":
      x = rects.reference.x - rects.floating.width;
      break;
    case "right":
      x = rects.reference.x + rects.reference.width;
      break;
  }

  // Calculate cross axis position
  switch (crossAxis) {
    case "start":
      if (mainAxis === "top" || mainAxis === "bottom") {
        x = rects.reference.x;
      } else {
        y = rects.reference.y;
      }
      break;
    case "end":
      if (mainAxis === "top" || mainAxis === "bottom") {
        x = rects.reference.x + rects.reference.width - rects.floating.width;
      } else {
        y = rects.reference.y + rects.reference.height - rects.floating.height;
      }
      break;
    default: // center
      if (mainAxis === "top" || mainAxis === "bottom") {
        x =
          rects.reference.x +
          (rects.reference.width - rects.floating.width) / 2;
      } else {
        y =
          rects.reference.y +
          (rects.reference.height - rects.floating.height) / 2;
      }
  }

  return {
    ...state,
    x,
    y,
    placement: newPlacement,
  };
}

/**
 * Calculates the available space for a given state
 */
function getAvailableSpace(state: ComputePositionState): number {
  const { x, y, rects } = state;
  const viewport = getViewportDimensions();
  const floatingWidth = rects.floating.width;
  const floatingHeight = rects.floating.height;

  // Calculate available space in each direction
  const top = y;
  const right = viewport.width - (x + floatingWidth);
  const bottom = viewport.height - (y + floatingHeight);
  const left = x;

  // Return the minimum available space
  return Math.min(top, right, bottom, left);
}
