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
      let shouldFlip = false;

      switch (mainAxis) {
        case "top":
          shouldFlip =
            state.y - padding < 0 || // Viewport top
            (containerBoundaries
              ? state.y - padding < containerBoundaries.top
              : false) || // Container top
            (outerBoundaries ? state.y - padding < outerBoundaries.top : false); // Outer container top
          break;
        case "bottom":
          shouldFlip =
            state.y + floating.height + padding > window.innerHeight || // Viewport bottom
            (containerBoundaries
              ? state.y + floating.height + padding > containerBoundaries.bottom
              : false) || // Container bottom
            (outerBoundaries
              ? state.y + floating.height + padding > outerBoundaries.bottom
              : false); // Outer container bottom
          break;
        case "left":
          shouldFlip =
            state.x - padding < 0 || // Viewport left
            (containerBoundaries
              ? state.x - padding < containerBoundaries.left
              : false) || // Container left
            (outerBoundaries
              ? state.x - padding < outerBoundaries.left
              : false); // Outer container left
          break;
        case "right":
          shouldFlip =
            state.x + floating.width + padding > window.innerWidth || // Viewport right
            (containerBoundaries
              ? state.x + floating.width + padding > containerBoundaries.right
              : false) || // Container right
            (outerBoundaries
              ? state.x + floating.width + padding > outerBoundaries.right
              : false); // Outer container right
          break;
      }

      if (shouldFlip) {
        const alignment = placement.split("-")[1] || "";
        const oppositePlacement =
          `${opposites[mainAxis]}${alignment ? `-${alignment}` : ""}` as Placement;

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

      return {};
    },
  };
}
