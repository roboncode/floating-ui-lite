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
  value: number,
  size: number,
  boundaries: Boundaries | null,
  mainAxis: MainAxis
): number {
  // For start positions (top/left)
  const isVertical = mainAxis === "top" || mainAxis === "bottom";
  const viewportSize = isVertical ? window.innerHeight : window.innerWidth;

  if (!boundaries) {
    return mainAxis === "top" || mainAxis === "left"
      ? value // Space from edge to value
      : viewportSize - (value + size); // Space from value to viewport edge
  }

  // Return space based on axis and direction
  switch (mainAxis) {
    case "top":
      return value - boundaries.top;
    case "bottom":
      return boundaries.bottom - (value + size);
    case "left":
      return value - boundaries.left;
    case "right":
      return boundaries.right - (value + size);
  }
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

  // Calculate available space for each boundary
  let spaces: number[] = [];

  switch (mainAxis) {
    case "top":
      spaces = [
        getAvailableSpace(y, floating.height, containerBoundaries, mainAxis),
        getAvailableSpace(y, floating.height, outerBoundaries, mainAxis),
      ];
      break;
    case "bottom":
      spaces = [
        getAvailableSpace(
          reference.y + reference.height,
          floating.height,
          containerBoundaries,
          mainAxis
        ),
        getAvailableSpace(
          reference.y + reference.height,
          floating.height,
          outerBoundaries,
          mainAxis
        ),
      ];
      break;
    case "left":
      spaces = [
        getAvailableSpace(x, floating.width, containerBoundaries, mainAxis),
        getAvailableSpace(x, floating.width, outerBoundaries, mainAxis),
      ];
      break;
    case "right":
      spaces = [
        getAvailableSpace(
          reference.x + reference.width,
          floating.width,
          containerBoundaries,
          mainAxis
        ),
        getAvailableSpace(
          reference.x + reference.width,
          floating.width,
          outerBoundaries,
          mainAxis
        ),
      ];
      break;
  }

  // Filter out null boundaries (represented by Infinity) and get minimum space
  const availableSpace = Math.min(...spaces.map((space) => space ?? Infinity));
  return availableSpace >= padding;
}

interface BoundaryCache {
  containerBoundaries: Boundaries | null;
  outerBoundaries: Boundaries | null;
}

function getBoundaries(container: HTMLElement): BoundaryCache {
  // Get container boundaries
  const containerBoundaries = isScrollableContainer(container)
    ? getContainerBoundaries(container)
    : null;

  // Get outer boundaries
  const outerScrollable = findScrollableParent(container);
  const outerBoundaries = outerScrollable
    ? getContainerBoundaries(outerScrollable)
    : null;

  return {
    containerBoundaries,
    outerBoundaries,
  };
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

      // Cache placement parts
      const [mainAxis, alignment = ""] = placement.split("-") as [
        MainAxis,
        string?,
      ];

      // Get and cache boundaries
      const { containerBoundaries, outerBoundaries } = getBoundaries(container);

      // Calculate space for current placement
      const currentSpace = hasEnoughSpace(
        state,
        mainAxis,
        containerBoundaries,
        outerBoundaries,
        padding
      );

      if (!currentSpace) {
        const oppositePlacement = `${opposites[mainAxis]}${
          alignment ? `-${alignment}` : ""
        }` as Placement;

        // Create a test state for the opposite placement
        const testState = {
          ...state,
          placement: oppositePlacement,
        };

        // Calculate space for opposite placement
        const oppositeSpace = hasEnoughSpace(
          testState,
          opposites[mainAxis],
          containerBoundaries,
          outerBoundaries,
          padding
        );

        if (oppositeSpace) {
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
