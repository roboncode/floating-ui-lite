import { ComputePositionState, Middleware, Placement } from "../../types";

import { getBoundingClientRect } from "../../utils/dom";

export interface FlipOptions {
  padding?: number;
}

type MainAxis = "top" | "bottom" | "left" | "right";
type Boundaries = ReturnType<typeof getContainerBoundaries>;

const opposites: Record<MainAxis, MainAxis> = {
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

function getAvailableSpace(
  referenceStart: number,
  referenceSize: number,
  containerEnd: number
): number {
  return containerEnd - (referenceStart + referenceSize);
}

function hasEnoughSpace(
  state: ComputePositionState,
  mainAxis: MainAxis,
  containerBoundaries: Boundaries | null,
  outerBoundaries: Boundaries | null,
  padding: number
): boolean {
  const { x, y } = state;
  const floating = state.rects.floating;
  const reference = state.rects.reference;

  switch (mainAxis) {
    case "top":
      return !(
        y - padding < 0 || // Viewport top
        (containerBoundaries && y - padding < containerBoundaries.top) || // Container top
        (outerBoundaries && y - padding < outerBoundaries.top) // Outer container top
      );
    case "bottom": {
      // For bottom placement, check if there's enough space below
      const bottomSpace = getAvailableSpace(
        reference.y,
        reference.height,
        window.innerHeight
      );
      const containerBottomSpace = containerBoundaries
        ? getAvailableSpace(
            reference.y,
            reference.height,
            containerBoundaries.bottom
          )
        : Infinity;
      const outerBottomSpace = outerBoundaries
        ? getAvailableSpace(
            reference.y,
            reference.height,
            outerBoundaries.bottom
          )
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
      const rightSpace = getAvailableSpace(
        reference.x,
        reference.width,
        window.innerWidth
      );
      const containerRightSpace = containerBoundaries
        ? getAvailableSpace(
            reference.x,
            reference.width,
            containerBoundaries.right
          )
        : Infinity;
      const outerRightSpace = outerBoundaries
        ? getAvailableSpace(reference.x, reference.width, outerBoundaries.right)
        : Infinity;

      // Use the most restrictive space
      const availableSpace = Math.min(
        rightSpace,
        containerRightSpace,
        outerRightSpace
      );

      return availableSpace >= floating.width + padding;
    }
  }
}

/**
 * Flip middleware that changes placement when there isn't enough space
 */
export function flip(options: FlipOptions = {}): Middleware {
  return {
    name: "flip",
    async fn(state: ComputePositionState) {
      const { placement, elements } = state;
      const { padding = 5 } = options;
      const container = elements.container || document.body;

      // Get the main axis from placement
      const [mainAxis] = placement.split("-") as [MainAxis];

      // Get container boundaries
      const containerBoundaries = isScrollableContainer(container)
        ? getContainerBoundaries(container)
        : null;

      const outerScrollable = findScrollableParent(container);
      const outerBoundaries = outerScrollable
        ? getContainerBoundaries(outerScrollable)
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
            dimensions: state.rects.floating,
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
