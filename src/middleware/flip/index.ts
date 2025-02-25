import { ComputePositionState, Middleware, Placement, Rect } from "../../types";

import { getBoundingClientRect } from "../../utils/dom";

export interface FlipOptions {
  padding?: number;
}

interface Boundaries {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

interface Space {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

interface PlacementSpace {
  placement: Placement;
  space: Space;
  availableSpace: number;
}

const opposites: Record<string, string> = {
  top: "bottom",
  bottom: "top",
  left: "right",
  right: "left",
};

/**
 * Gets the viewport boundaries
 */
function getViewportBoundaries(): Boundaries {
  return {
    top: 0,
    right: window.innerWidth,
    bottom: window.innerHeight,
    left: 0,
  };
}

/**
 * Gets the container boundaries in viewport coordinates
 */
function getContainerBoundaries(container: HTMLElement): Boundaries {
  if (container === document.body) {
    return getViewportBoundaries();
  }

  const rect = getBoundingClientRect(container);
  return {
    top: rect.y,
    right: rect.x + rect.width,
    bottom: rect.y + rect.height,
    left: rect.x,
  };
}

/**
 * Creates a virtual rect for the floating element at a given position
 */
function createVirtualRect(x: number, y: number, floating: Rect): Rect {
  return {
    x,
    y,
    width: floating.width,
    height: floating.height,
  };
}

/**
 * Calculates the available space between an element and boundaries
 */
function calculateAvailableSpace(
  elementRect: Rect,
  boundaries: Boundaries
): Space {
  return {
    top: elementRect.y - boundaries.top,
    right: boundaries.right - (elementRect.x + elementRect.width),
    bottom: boundaries.bottom - (elementRect.y + elementRect.height),
    left: elementRect.x - boundaries.left,
  };
}

/**
 * Calculates the minimum available space considering both container and viewport
 */
function getMinimumSpace(containerSpace: Space, viewportSpace: Space): Space {
  return {
    top: Math.min(containerSpace.top, viewportSpace.top),
    right: Math.min(containerSpace.right, viewportSpace.right),
    bottom: Math.min(containerSpace.bottom, viewportSpace.bottom),
    left: Math.min(containerSpace.left, viewportSpace.left),
  };
}

/**
 * Calculates the position and available space for a specific placement
 */
function getPlacementSpace(
  state: ComputePositionState,
  placement: Placement,
  containerBoundaries: Boundaries,
  viewportBoundaries: Boundaries
): PlacementSpace {
  const [mainAxis] = placement.split("-");
  const { floating, reference } = state.rects;

  // Calculate position in viewport coordinates
  let x = reference.x;
  let y = reference.y;

  switch (mainAxis) {
    case "top":
      y = reference.y - floating.height;
      break;
    case "bottom":
      y = reference.y + reference.height;
      break;
    case "left":
      x = reference.x - floating.width;
      break;
    case "right":
      x = reference.x + reference.width;
      break;
  }

  const virtualRect = createVirtualRect(x, y, floating);

  // Calculate space for both container and viewport
  const containerSpace = calculateAvailableSpace(
    virtualRect,
    containerBoundaries
  );
  const viewportSpace = calculateAvailableSpace(
    virtualRect,
    viewportBoundaries
  );

  // Use the minimum available space between container and viewport
  const space = getMinimumSpace(containerSpace, viewportSpace);
  const availableSpace = space[mainAxis as keyof Space];

  return {
    placement,
    space,
    availableSpace,
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

      // Get both container and viewport boundaries
      const container = elements.container || document.body;
      const containerBoundaries = getContainerBoundaries(container);
      const viewportBoundaries = getViewportBoundaries();

      // Get the main axis and opposite placement
      const [mainAxis, alignment = ""] = placement.split("-");
      const oppositePlacement =
        `${opposites[mainAxis]}${alignment ? `-${alignment}` : ""}` as Placement;

      // Check space for both current and opposite placements
      const currentSpace = getPlacementSpace(
        state,
        placement,
        containerBoundaries,
        viewportBoundaries
      );
      const oppositeSpace = getPlacementSpace(
        state,
        oppositePlacement,
        containerBoundaries,
        viewportBoundaries
      );

      // Debug log
      console.log("Flip calculation:", {
        placement,
        container: container === document.body ? "body" : "custom",
        containerBoundaries,
        viewportBoundaries,
        currentSpace,
        oppositeSpace,
        padding,
      });

      // If current placement has enough space, keep it
      if (currentSpace.availableSpace >= padding) {
        return {};
      }

      // If opposite has more space, use it
      if (oppositeSpace.availableSpace > currentSpace.availableSpace) {
        return {
          placement: oppositePlacement,
          middlewareData: {
            ...state.middlewareData,
            flip: {
              originalPlacement: placement,
              finalPlacement: oppositePlacement,
              spaces: {
                original: currentSpace,
                opposite: oppositeSpace,
              },
            },
          },
        };
      }

      // If neither has enough space, keep the original placement
      return {};
    },
  };
}
