import {
  ComputePositionState,
  Middleware,
  Placement,
  Rect,
  Strategy,
} from "../types";

import { getBoundingClientRect } from "../utils/dom";

interface ComputePositionOptions {
  placement?: Placement;
  strategy?: Strategy;
  middleware?: Middleware[];
}

const defaultOptions: Required<ComputePositionOptions> = {
  placement: "bottom",
  strategy: "absolute",
  middleware: [],
};

/**
 * Computes the position of the floating element relative to the reference element
 */
export async function computePosition(
  reference: Element,
  floating: HTMLElement,
  options: ComputePositionOptions = {}
): Promise<ComputePositionState> {
  const {
    placement = defaultOptions.placement,
    strategy = defaultOptions.strategy,
    middleware = defaultOptions.middleware,
  } = options;

  // Get rects before creating state to ensure they're fresh
  const referenceRect = getBoundingClientRect(reference);
  const floatingRect = getBoundingClientRect(floating);

  // Initial state
  const state: ComputePositionState = {
    x: 0,
    y: 0,
    strategy,
    placement,
    elements: { reference, floating },
    rects: {
      reference: referenceRect,
      floating: floatingRect,
    },
    middlewareData: {},
  };

  // Calculate initial position based on placement
  const { x, y } = computeInitialPosition(
    state.rects.reference,
    state.rects.floating,
    state.placement
  );
  state.x = x;
  state.y = y;

  // Run middleware
  for (const { fn } of middleware) {
    const nextState = await fn(state);
    // First merge middlewareData to avoid it being overwritten
    if (nextState.middlewareData) {
      state.middlewareData = {
        ...state.middlewareData,
        ...nextState.middlewareData,
      };
      delete nextState.middlewareData;
    }
    // Then merge the rest of the state
    Object.assign(state, nextState);
  }

  return state;
}

/**
 * Computes the initial position based on placement
 */
function computeInitialPosition(
  reference: Rect,
  floating: Rect,
  placement: Placement
): { x: number; y: number } {
  const [mainAxis, crossAxis = "center"] = placement.split("-");

  // Initialize x and y at the reference position
  let x = reference.x;
  let y = reference.y;

  // For bottom placement with center alignment, align with reference center
  if (mainAxis === "bottom" && crossAxis === "center") {
    x = reference.x;
  }

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
      // No adjustment needed for start alignment
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
        x = reference.x;
      } else {
        y = reference.y + (reference.height - floating.height) / 2;
      }
  }

  // Ensure x and y are integers to avoid subpixel rendering
  return {
    x: Math.round(x),
    y: Math.round(y),
  };
}
