import {
  ComputePositionOptions,
  ComputePositionState,
  Placement,
} from "../types";

import { RectCacheManager } from "../utils/rectCache";
import { getBoundingClientRect } from "./getBoundingClientRect";
import { getScrollParents } from "./getScrollParents";
import { getViewportRect } from "./getViewportRect";
import { getWindowScroll } from "./getWindowScroll";

const defaultOptions: Required<Omit<ComputePositionOptions, "middleware">> = {
  placement: "bottom",
  strategy: "absolute",
  container: document.body,
  visibilityState: {
    isReferenceVisible: false,
    isFloatingVisible: false,
    isReferenceInView: false,
    isFloatingInView: false,
  },
};

/**
 * Computes the position of a floating element relative to its reference element.
 * Handles different container contexts and scroll scenarios.
 */
export async function computePosition(
  reference: HTMLElement,
  floating: HTMLElement,
  options: ComputePositionOptions = {}
): Promise<ComputePositionState> {
  // Clear any existing cached rects
  RectCacheManager.clear();

  const {
    placement = defaultOptions.placement,
    strategy = defaultOptions.strategy,
    container = defaultOptions.container,
    middleware = [],
    visibilityState,
  } = options;

  // Get element rectangles - only calculate what's needed
  const referenceRect = getBoundingClientRect(reference);
  const floatingRect = getBoundingClientRect(floating);

  // Only calculate container rect if not body
  const containerRect =
    container === document.body
      ? getViewportRect()
      : getBoundingClientRect(container);

  // Get window scroll position once
  const windowScroll = getWindowScroll();

  // Calculate scroll offsets from scrollable parents
  const scrollParents = getScrollParents(reference, container);
  const scrollOffset = scrollParents.reduce<{ x: number; y: number }>(
    (offset, parent) => ({
      x: offset.x + (parent.scrollLeft || 0),
      y: offset.y + (parent.scrollTop || 0),
    }),
    { x: 0, y: 0 }
  );

  // Calculate initial position based on placement
  const { x, y } = computeInitialPosition(
    referenceRect,
    floatingRect,
    placement
  );

  const initialState: ComputePositionState = {
    x,
    y,
    strategy,
    placement,
    elements: {
      reference,
      floating,
      container,
    },
    rects: {
      reference: referenceRect,
      floating: floatingRect,
    },
    middlewareData: {},
    visibilityState,
  };

  // Run middleware
  const finalState = await middleware.reduce(async (promise, { fn }) => {
    const currentState = await promise;
    const response = await fn(currentState);
    return response ? { ...currentState, ...response } : currentState;
  }, Promise.resolve(initialState));

  // Adjust position based on strategy and container context
  if (strategy === "absolute") {
    const isBodyContainer = container === document.body;
    finalState.x += isBodyContainer
      ? windowScroll.x
      : -containerRect.x + scrollOffset.x;
    finalState.y += isBodyContainer
      ? windowScroll.y
      : -containerRect.y + scrollOffset.y;
  }

  // Clear cache after computation
  RectCacheManager.clear();

  return finalState;
}

/**
 * Calculates the initial position of the floating element based on its placement preference.
 * This position will be adjusted later for scroll and container context.
 */
export function computeInitialPosition(
  reference: DOMRect,
  floating: DOMRect,
  placement: Placement
): { x: number; y: number } {
  const [mainAxis, crossAxis = "center"] = placement.split("-");

  // Initialize at reference position
  let x = reference.x;
  let y = reference.y;

  // Adjust based on main placement axis
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

  // Adjust cross axis alignment
  switch (crossAxis) {
    case "start":
      // No adjustment needed
      break;
    case "end":
      if (mainAxis === "top" || mainAxis === "bottom") {
        x = reference.x + reference.width - floating.width;
      } else {
        y = reference.y + reference.height - floating.height;
      }
      break;
    default: // center
      if (mainAxis === "top" || mainAxis === "bottom") {
        x = reference.x + (reference.width - floating.width) / 2;
      } else {
        y = reference.y + (reference.height - floating.height) / 2;
      }
  }

  return { x: Math.round(x), y: Math.round(y) };
}
