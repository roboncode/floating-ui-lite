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

function checkBoundaryViolation(
  value: number,
  size: number,
  boundaries: Boundaries | null,
  padding: number,
  isStart: boolean
): boolean {
  // For start positions (top/left)
  if (isStart) {
    if (!boundaries) {
      return value - padding < 0; // Only check viewport boundary
    }
    return (
      value - padding < 0 ||
      value - padding < (isStart ? boundaries.top : boundaries.left)
    );
  }

  // For end positions (bottom/right)
  const viewportSize = isStart ? window.innerHeight : window.innerWidth;
  const availableSpace = boundaries
    ? boundaries[isStart ? "bottom" : "right"] - value
    : viewportSize - value;

  return availableSpace < size + padding;
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
      return (
        !checkBoundaryViolation(
          y,
          floating.height,
          containerBoundaries,
          padding,
          true
        ) &&
        !checkBoundaryViolation(
          y,
          floating.height,
          outerBoundaries,
          padding,
          true
        )
      );
    case "bottom":
      return (
        !checkBoundaryViolation(
          reference.y + reference.height,
          floating.height,
          containerBoundaries,
          padding,
          false
        ) &&
        !checkBoundaryViolation(
          reference.y + reference.height,
          floating.height,
          outerBoundaries,
          padding,
          false
        )
      );
    case "left":
      return (
        !checkBoundaryViolation(
          x,
          floating.width,
          containerBoundaries,
          padding,
          true
        ) &&
        !checkBoundaryViolation(
          x,
          floating.width,
          outerBoundaries,
          padding,
          true
        )
      );
    case "right":
      return (
        !checkBoundaryViolation(
          reference.x + reference.width,
          floating.width,
          containerBoundaries,
          padding,
          false
        ) &&
        !checkBoundaryViolation(
          reference.x + reference.width,
          floating.width,
          outerBoundaries,
          padding,
          false
        )
      );
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
