import { ComputePositionState, Middleware, Placement } from "../types";

import { computeInitialPosition } from "../core/computePosition";
import { getBoundingClientRect } from "../core/getBoundingClientRect";
import { getScrollParents } from "../core/getScrollParents";
import { getViewportDimensions } from "../core/getViewportDimensions";
import { isScrollable } from "../core/isScrollable";
import { shouldSkipMiddleware } from "../utils/shouldSkipMiddleware";

/**
 * Configuration options for the flip middleware
 */
export interface FlipOptions {
  padding?: number;
}

/**
 * Represents the main axis of placement (top, bottom, left, right)
 */
type MainAxis = "top" | "bottom" | "left" | "right";

/**
 * Type alias for the boundaries object
 */
type Boundaries = ReturnType<typeof getContainerBoundaries>;

/**
 * Viewport dimensions type
 */
interface ViewportDimensions {
  width: number;
  height: number;
}

/**
 * Maps each placement to its opposite direction
 */
const opposites: Record<MainAxis, MainAxis> = {
  top: "bottom",
  bottom: "top",
  left: "right",
  right: "left",
};

function getContainerBoundaries(container: HTMLElement) {
  const rect = getBoundingClientRect(container);
  return {
    top: rect.y,
    right: rect.x + rect.width,
    bottom: rect.y + rect.height,
    left: rect.x,
  };
}

function getAvailableSpace(
  value: number,
  size: number,
  boundaries: Boundaries | null,
  mainAxis: MainAxis,
  viewport: ViewportDimensions
): number {
  const isVertical = mainAxis === "top" || mainAxis === "bottom";
  const viewportSize = isVertical ? viewport.height : viewport.width;

  const viewportSpace =
    mainAxis === "top" || mainAxis === "left"
      ? value
      : viewportSize - (value + size);

  if (!boundaries) {
    return viewportSpace;
  }

  let containerSpace: number;
  switch (mainAxis) {
    case "top":
      containerSpace = value - boundaries.top;
      break;
    case "bottom":
      containerSpace = boundaries.bottom - (value + size);
      break;
    case "left":
      containerSpace = value - boundaries.left;
      break;
    case "right":
      containerSpace = boundaries.right - (value + size);
      break;
  }

  return Math.min(viewportSpace, containerSpace);
}

function hasEnoughSpace(
  state: ComputePositionState,
  mainAxis: MainAxis,
  containerBoundaries: Boundaries | null,
  outerBoundaries: Boundaries | null,
  padding: number,
  viewport: ViewportDimensions
): boolean {
  const { x, y } = state;
  const floating = state.rects.floating;
  const reference = state.rects.reference;

  let spaces: number[] = [];

  switch (mainAxis) {
    case "top":
      spaces = [
        getAvailableSpace(
          y,
          floating.height,
          containerBoundaries,
          mainAxis,
          viewport
        ),
        getAvailableSpace(
          y,
          floating.height,
          outerBoundaries,
          mainAxis,
          viewport
        ),
      ];
      break;
    case "bottom":
      spaces = [
        getAvailableSpace(
          reference.y + reference.height,
          floating.height,
          containerBoundaries,
          mainAxis,
          viewport
        ),
        getAvailableSpace(
          reference.y + reference.height,
          floating.height,
          outerBoundaries,
          mainAxis,
          viewport
        ),
      ];
      break;
    case "left":
      spaces = [
        getAvailableSpace(
          x,
          floating.width,
          containerBoundaries,
          mainAxis,
          viewport
        ),
        getAvailableSpace(
          x,
          floating.width,
          outerBoundaries,
          mainAxis,
          viewport
        ),
      ];
      break;
    case "right":
      spaces = [
        getAvailableSpace(
          reference.x + reference.width,
          floating.width,
          containerBoundaries,
          mainAxis,
          viewport
        ),
        getAvailableSpace(
          reference.x + reference.width,
          floating.width,
          outerBoundaries,
          mainAxis,
          viewport
        ),
      ];
      break;
  }

  const availableSpace = Math.min(...spaces.map((space) => space ?? Infinity));

  return availableSpace >= padding;
}

interface BoundaryCache {
  containerBoundaries: Boundaries | null;
  outerBoundaries: Boundaries | null;
}

function getBoundaries(container: HTMLElement): BoundaryCache {
  const containerBoundaries = isScrollable(container)
    ? getContainerBoundaries(container)
    : null;

  const scrollParents = getScrollParents(container, document.body);
  const outerScrollable = scrollParents[0] as HTMLElement | null;
  const outerBoundaries = outerScrollable
    ? getContainerBoundaries(outerScrollable)
    : null;

  return {
    containerBoundaries,
    outerBoundaries,
  };
}

export function flip(options: FlipOptions = {}): Middleware {
  return {
    name: "flip",
    fn: async (state: ComputePositionState) => {
      if (shouldSkipMiddleware(state)) {
        return {};
      }

      const { placement, elements } = state;
      const { padding = 0 } = options;
      const container = elements.container || document.body;

      const [mainAxis, alignment = ""] = placement.split("-") as [
        MainAxis,
        string?,
      ];

      const { containerBoundaries, outerBoundaries } = getBoundaries(container);
      const viewport = getViewportDimensions();

      const currentSpace = hasEnoughSpace(
        state,
        mainAxis,
        containerBoundaries,
        outerBoundaries,
        padding,
        viewport
      );

      if (!currentSpace) {
        const oppositePlacement = `${opposites[mainAxis]}${
          alignment ? `-${alignment}` : ""
        }` as Placement;

        const offsetValue = state.middlewareData.offset?.value ?? 0;

        const testState = {
          ...state,
          placement: oppositePlacement,
          ...(opposites[mainAxis] === "top" && { y: state.y - offsetValue }),
          ...(opposites[mainAxis] === "bottom" && { y: state.y + offsetValue }),
          ...(opposites[mainAxis] === "left" && { x: state.x - offsetValue }),
          ...(opposites[mainAxis] === "right" && { x: state.x + offsetValue }),
        };

        const oppositeSpace = hasEnoughSpace(
          testState,
          opposites[mainAxis],
          containerBoundaries,
          outerBoundaries,
          padding,
          viewport
        );

        if (oppositeSpace) {
          const { x, y } = computeInitialPosition(
            state.rects.reference,
            state.rects.floating,
            oppositePlacement
          );

          const [oppositeMainAxis] = oppositePlacement.split("-");
          const adjustedPosition = {
            x,
            y,
            ...(oppositeMainAxis === "top" && { y: y - offsetValue }),
            ...(oppositeMainAxis === "bottom" && { y: y + offsetValue }),
            ...(oppositeMainAxis === "left" && { x: x - offsetValue }),
            ...(oppositeMainAxis === "right" && { x: x + offsetValue }),
          };

          return {
            placement: oppositePlacement,
            ...adjustedPosition,
          };
        }
      }

      return {};
    },
  };
}
