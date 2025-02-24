import { ComputePositionState, Middleware, Placement } from "../../types";

interface PlacementOptions {
  fallbackPlacements?: Placement[];
  padding?: number;
}

/**
 * Gets the viewport dimensions
 */
function getViewportDimensions(): { width: number; height: number } {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

/**
 * Placement middleware that handles positioning the floating element
 * and provides fallback placements if the primary placement doesn't fit
 */
export function placement(options: PlacementOptions = {}): Middleware {
  return {
    name: "placement",
    async fn(state: ComputePositionState) {
      const { placement } = state;
      const { fallbackPlacements = [], padding = 5 } = options;

      // Calculate initial position
      const initialPosition = computePlacementPosition(state, placement);
      const initialState = { ...state, ...initialPosition };

      // Check if current placement fits
      if (fitsInViewport(initialState, padding)) {
        return {};
      }

      // Try fallback placements in order
      for (const fallbackPlacement of fallbackPlacements) {
        const fallbackState = computePlacementPosition(
          state,
          fallbackPlacement
        );
        const testState = { ...state, ...fallbackState };

        // Check if fallback placement fits
        if (fitsInViewport(testState, padding)) {
          return {
            ...fallbackState,
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
        const testPosition = computePlacementPosition(state, testPlacement);
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
  const { x, y, rects } = state;
  const viewport = getViewportDimensions();

  // Check if the floating element would be rendered within the viewport bounds
  const top = y;
  const right = x + rects.floating.width;
  const bottom = y + rects.floating.height;
  const left = x;

  // Check if any part of the floating element would be outside the viewport
  const isOutsideViewport =
    left < padding ||
    top < padding ||
    right > viewport.width - padding ||
    bottom > viewport.height - padding;

  return !isOutsideViewport;
}

/**
 * Calculates the available space for a given state
 */
function getAvailableSpace(state: ComputePositionState): number {
  const { x, y, rects } = state;
  const viewport = getViewportDimensions();

  // Calculate available space in each direction
  const top = y;
  const right = viewport.width - (x + rects.floating.width);
  const bottom = viewport.height - (y + rects.floating.height);
  const left = x;

  // Return the minimum available space
  return Math.min(top, right, bottom, left);
}

/**
 * Computes the position based on the placement
 */
function computePlacementPosition(
  state: ComputePositionState,
  newPlacement: Placement
): { x: number; y: number } {
  const { rects } = state;
  const [mainAxis, crossAxis = "center"] = newPlacement.split("-");

  let x = rects.reference.x;
  let y = rects.reference.y;

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

  switch (crossAxis) {
    case "start":
      // No adjustment needed for start alignment
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

  return { x, y };
}
