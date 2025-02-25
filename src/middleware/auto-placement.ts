import { ComputePositionState, Middleware, Placement } from "../types";

interface AutoPlacementOptions {
  allowedPlacements?: Placement[];
  padding?: number;
}

/**
 * Gets the available space for a given state and placement
 */
function getAvailableSpace(
  state: ComputePositionState,
  placement: Placement
): number {
  const { x, y, rects } = state;
  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight,
  };

  // Calculate space in each direction
  const spaces = {
    top: y,
    right: viewport.width - (x + rects.floating.width),
    bottom: viewport.height - (y + rects.floating.height),
    left: x,
  };

  // For corner placements, consider both axes
  const [mainAxis, crossAxis] = placement.split("-");
  if (crossAxis === "start" || crossAxis === "end") {
    return Math.min(
      spaces[mainAxis as keyof typeof spaces],
      spaces[crossAxis === "start" ? "left" : "right"]
    );
  }

  return spaces[mainAxis as keyof typeof spaces];
}

/**
 * AutoPlacement middleware that automatically chooses the placement with the most space
 */
export function autoPlacement(options: AutoPlacementOptions = {}): Middleware {
  return {
    name: "autoPlacement",
    async fn(state: ComputePositionState) {
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

      // If current placement has enough space, keep it
      const currentSpace = getAvailableSpace(state, state.placement);
      if (currentSpace >= padding) {
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
        return {
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
