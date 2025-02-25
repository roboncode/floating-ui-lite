import { ComputePositionState, Middleware, Placement } from "../../types";

import { getBoundingClientRect } from "../../utils/dom";

/**
 * Configuration options for the flip middleware
 * @property {number} padding - Minimum required space between element and boundaries
 * @property {boolean} debug - Enable debug logging for space calculations
 */
export interface FlipOptions {
  padding?: number;
  debug?: boolean;
}

/**
 * Represents the main axis of placement (top, bottom, left, right)
 * Used to determine the primary direction of positioning
 */
type MainAxis = "top" | "bottom" | "left" | "right";

/**
 * Type alias for the boundaries object returned by getContainerBoundaries
 * Contains coordinates of container edges in viewport space
 */
type Boundaries = ReturnType<typeof getContainerBoundaries>;

/**
 * Maps each placement to its opposite direction
 * Used when flipping element placement to the opposite side
 */
const opposites: Record<MainAxis, MainAxis> = {
  top: "bottom",
  bottom: "top",
  left: "right",
  right: "left",
};

/**
 * Determines if a container element is scrollable
 * Checks computed styles for overflow properties
 * Body is never considered scrollable in this context
 *
 * @param container - The HTML element to check
 * @returns boolean - True if the container is scrollable
 */
function isScrollableContainer(container: HTMLElement): boolean {
  if (container === document.body) return false;
  const { overflow, overflowX, overflowY } = window.getComputedStyle(container);
  return /(auto|scroll|overlay)/.test(overflow + overflowY + overflowX);
}

/**
 * Gets the boundaries of a container in viewport coordinates
 * Uses getBoundingClientRect for accurate viewport-relative positioning
 *
 * @param container - The container element to get boundaries for
 * @returns Boundaries object with top, right, bottom, left coordinates
 */
function getContainerBoundaries(container: HTMLElement) {
  const rect = getBoundingClientRect(container);
  return {
    top: rect.y,
    right: rect.x + rect.width,
    bottom: rect.y + rect.height,
    left: rect.x,
  };
}

/**
 * Finds the nearest scrollable parent element
 * Traverses up the DOM tree until it finds a scrollable container
 * Used to determine which container's boundaries to consider
 *
 * @param element - The starting element to search from
 * @returns HTMLElement | null - The nearest scrollable parent or null if none found
 */
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
 * Represents viewport dimensions
 * Used to cache window dimensions and avoid repeated DOM reads
 */
interface ViewportDimensions {
  width: number;
  height: number;
}

/**
 * Gets current viewport dimensions
 * Caches the values to avoid layout thrashing
 */
function getViewportDimensions(): ViewportDimensions {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

/**
 * Calculates available space for a given position and boundaries
 * Considers both viewport and container boundaries
 * Returns the most restrictive space available
 *
 * @param value - Current coordinate value (x or y)
 * @param size - Size of the floating element in the relevant dimension
 * @param boundaries - Container boundaries to check against
 * @param mainAxis - Primary axis of placement
 * @param viewport - Cached viewport dimensions
 * @returns number - Available space in pixels
 */
function getAvailableSpace(
  value: number,
  size: number,
  boundaries: Boundaries | null,
  mainAxis: MainAxis,
  viewport: ViewportDimensions
): number {
  // Determine if we're working with vertical or horizontal axis
  const isVertical = mainAxis === "top" || mainAxis === "bottom";
  const viewportSize = isVertical ? viewport.height : viewport.width;

  // Calculate space relative to viewport edges
  const viewportSpace =
    mainAxis === "top" || mainAxis === "left"
      ? value // For top/left, space is distance from edge
      : viewportSize - (value + size); // For bottom/right, space is remaining distance

  // If no container boundaries, only consider viewport
  if (!boundaries) {
    return viewportSpace;
  }

  // Calculate space relative to container boundaries
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

  // Return the smaller of viewport and container space
  return Math.min(viewportSpace, containerSpace);
}

/**
 * Determines if there's enough space for the floating element
 * Checks both container and outer container boundaries
 * Considers padding requirements
 *
 * @param state - Current position state
 * @param mainAxis - Primary placement axis
 * @param containerBoundaries - Immediate container boundaries
 * @param outerBoundaries - Outer container boundaries
 * @param padding - Required space padding
 * @param viewport - Cached viewport dimensions
 * @param debug - Enable debug logging
 * @returns boolean - True if there's enough space
 */
function hasEnoughSpace(
  state: ComputePositionState,
  mainAxis: MainAxis,
  containerBoundaries: Boundaries | null,
  outerBoundaries: Boundaries | null,
  padding: number,
  viewport: ViewportDimensions,
  debug?: boolean
): boolean {
  const { x, y } = state;
  const floating = state.rects.floating;
  const reference = state.rects.reference;

  // Calculate space for each relevant boundary
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

  // Find the most restrictive space available
  const availableSpace = Math.min(...spaces.map((space) => space ?? Infinity));

  // Log debug information if enabled
  if (debug) {
    console.log("Space calculation:", {
      mainAxis,
      spaces,
      availableSpace,
      padding,
      hasEnough: availableSpace >= padding,
    });
  }

  return availableSpace >= padding;
}

/**
 * Cache object for container boundaries
 * Stores both immediate container and outer container boundaries
 */
interface BoundaryCache {
  containerBoundaries: Boundaries | null;
  outerBoundaries: Boundaries | null;
}

/**
 * Gets and caches boundaries for both container and outer container
 * Reduces DOM reads by caching the results
 *
 * @param container - The container element
 * @returns BoundaryCache - Cached boundaries for both containers
 */
function getBoundaries(container: HTMLElement): BoundaryCache {
  // Get immediate container boundaries if scrollable
  const containerBoundaries = isScrollableContainer(container)
    ? getContainerBoundaries(container)
    : null;

  // Find and get outer container boundaries
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
 * Flip middleware that changes element placement when there isn't enough space
 * Handles nested scrollable containers and viewport boundaries
 * Supports debug logging for troubleshooting
 *
 * Key features:
 * - Checks both container and viewport boundaries
 * - Handles nested scrollable containers
 * - Caches calculations to improve performance
 * - Provides detailed debug logging
 * - Maintains alignment when flipping
 *
 * @param options - Configuration options for the middleware
 * @returns Middleware - The flip middleware function
 */
export function flip(options: FlipOptions = {}): Middleware {
  return {
    name: "flip",
    async fn(state: ComputePositionState) {
      const { placement, elements } = state;
      const { padding = 5, debug = false } = options;
      const container = elements.container || document.body;

      // Extract and cache placement information
      const [mainAxis, alignment = ""] = placement.split("-") as [
        MainAxis,
        string?,
      ];

      // Get and cache all relevant boundaries
      const { containerBoundaries, outerBoundaries } = getBoundaries(container);

      // Cache viewport dimensions
      const viewport = getViewportDimensions();

      // Check if current placement has enough space
      const currentSpace = hasEnoughSpace(
        state,
        mainAxis,
        containerBoundaries,
        outerBoundaries,
        padding,
        viewport,
        debug
      );

      // If current placement doesn't have enough space, try opposite
      if (!currentSpace) {
        const oppositePlacement = `${opposites[mainAxis]}${
          alignment ? `-${alignment}` : ""
        }` as Placement;

        // Create test state for opposite placement
        const testState = {
          ...state,
          placement: oppositePlacement,
        };

        // Check if opposite placement has enough space
        const oppositeSpace = hasEnoughSpace(
          testState,
          opposites[mainAxis],
          containerBoundaries,
          outerBoundaries,
          padding,
          viewport,
          debug
        );

        // If opposite has space, flip to it
        if (oppositeSpace) {
          if (debug) {
            console.log("Flipping from", placement, "to", oppositePlacement, {
              position: { x: state.x, y: state.y },
              dimensions: state.rects.floating,
              viewport,
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
          }

          return {
            placement: oppositePlacement,
          };
        }
      }

      // If no flip needed or possible, return empty object
      return {};
    },
  };
}
