import { ComputePositionState, Middleware, Placement } from "../../types";

import { getBoundingClientRect } from "../../utils/dom";

export interface FlipOptions {
  padding?: number;
}

const opposites: Record<string, string> = {
  top: "bottom",
  bottom: "top",
  left: "right",
  right: "left",
};

function isScrollableContainer(container: HTMLElement): boolean {
  if (container === document.body) return false;
  const { overflow, overflowX, overflowY } = window.getComputedStyle(container);
  return /(auto|scroll|overlay)/.test(overflow + overflowY + overflowX);
}

function getContainerBoundaries(container: HTMLElement) {
  const rect = getBoundingClientRect(container);
  return {
    top: rect.y,
    right: rect.x + rect.width,
    bottom: rect.y + rect.height,
    left: rect.x,
  };
}

function findScrollableParent(element: Element): HTMLElement | null {
  let parent = element.parentElement;
  while (parent) {
    if (isScrollableContainer(parent)) {
      return parent;
    }
    parent = parent.parentElement;
  }
  return null;
}

function hasEnoughSpace(
  state: ComputePositionState,
  mainAxis: string,
  containerBoundaries: ReturnType<typeof getContainerBoundaries> | null,
  outerBoundaries: ReturnType<typeof getContainerBoundaries> | null,
  padding: number
): boolean {
  const { x, y } = state;
  const floating = state.rects.floating;
  const reference = state.rects.reference;

  switch (mainAxis) {
    case "top":
      // For top placement, check if there's enough space above
      return !(
        y - padding < 0 || // Viewport top
        (containerBoundaries && y - padding < containerBoundaries.top) || // Container top
        (outerBoundaries && y - padding < outerBoundaries.top) // Outer container top
      );
    case "bottom": {
      // For bottom placement, check if there's enough space below
      const bottomSpace = window.innerHeight - (reference.y + reference.height);
      const containerBottomSpace = containerBoundaries
        ? containerBoundaries.bottom - (reference.y + reference.height)
        : Infinity;
      const outerBottomSpace = outerBoundaries
        ? outerBoundaries.bottom - (reference.y + reference.height)
        : Infinity;

      // Use the most restrictive space
      const availableSpace = Math.min(
        bottomSpace,
        containerBottomSpace,
        outerBottomSpace
      );

      return availableSpace >= floating.height + padding;
    }
    case "left":
      return !(
        x - padding < 0 || // Viewport left
        (containerBoundaries && x - padding < containerBoundaries.left) || // Container left
        (outerBoundaries && x - padding < outerBoundaries.left) // Outer container left
      );
    case "right": {
      // For right placement, check if there's enough space to the right
      const rightSpace = window.innerWidth - (reference.x + reference.width);
      const containerRightSpace = containerBoundaries
        ? containerBoundaries.right - (reference.x + reference.width)
        : Infinity;
      const outerRightSpace = outerBoundaries
        ? outerBoundaries.right - (reference.x + reference.width)
        : Infinity;

      // Use the most restrictive space
      const availableSpace = Math.min(
        rightSpace,
        containerRightSpace,
        outerRightSpace
      );

      return availableSpace >= floating.width + padding;
    }
    default:
      return true;
  }
}

/**
 * Flip middleware that changes placement when there isn't enough space
 */
export function flip(options: FlipOptions = {}): Middleware {
  return {
    name: "flip",
    async fn(state: ComputePositionState) {
      const { placement, rects, elements } = state;
      const { padding = 5 } = options;
      const container = elements.container || document.body;

      // Get the main axis from placement
      const [mainAxis] = placement.split("-");
      const floating = rects.floating;

      // Check for outer scrollable container
      const outerScrollable = findScrollableParent(container);
      const outerBoundaries = outerScrollable
        ? getContainerBoundaries(outerScrollable)
        : null;

      // Get immediate container boundaries if scrollable
      const containerBoundaries = isScrollableContainer(container)
        ? getContainerBoundaries(container)
        : null;

      // Check if we need to flip based on available space
      const hasSpace = hasEnoughSpace(
        state,
        mainAxis,
        containerBoundaries,
        outerBoundaries,
        padding
      );

      if (!hasSpace) {
        const alignment = placement.split("-")[1] || "";
        const oppositePlacement = `${opposites[mainAxis]}${
          alignment ? `-${alignment}` : ""
        }` as Placement;

        // Create a test state for the opposite placement
        const testState = {
          ...state,
          placement: oppositePlacement,
        };

        // Only flip if the opposite placement has space
        const oppositeHasSpace = hasEnoughSpace(
          testState,
          opposites[mainAxis],
          containerBoundaries,
          outerBoundaries,
          padding
        );

        if (oppositeHasSpace) {
          console.log("Flipping from", placement, "to", oppositePlacement, {
            position: { x: state.x, y: state.y },
            dimensions: { width: floating.width, height: floating.height },
            viewport: { width: window.innerWidth, height: window.innerHeight },
            container: containerBoundaries
              ? {
                  top: containerBoundaries.top,
                  right: containerBoundaries.right,
                  bottom: containerBoundaries.bottom,
                  left: containerBoundaries.left,
                }
              : "body",
            outerContainer: outerBoundaries
              ? {
                  top: outerBoundaries.top,
                  right: outerBoundaries.right,
                  bottom: outerBoundaries.bottom,
                  left: outerBoundaries.left,
                }
              : null,
            isScrollable: isScrollableContainer(container),
          });

          return {
            placement: oppositePlacement,
          };
        }
      }

      return {};
    },
  };
}
