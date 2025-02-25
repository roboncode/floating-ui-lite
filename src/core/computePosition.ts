import {
  ComputePositionOptions,
  ComputePositionState,
  Placement,
  Rect,
} from "../types";

import { getBoundingClientRect } from "../utils/dom";

const defaultOptions: Required<ComputePositionOptions> = {
  placement: "bottom",
  strategy: "absolute",
  middleware: [],
  container: document.body,
};

function getScrollParents(element: Element, container: HTMLElement): Element[] {
  const parents: Element[] = [];
  let parent = element.parentElement;

  while (parent && parent !== container.parentElement) {
    const style = window.getComputedStyle(parent);
    const { overflow, overflowX, overflowY } = style;

    if (/(auto|scroll|overlay)/.test(overflow + overflowY + overflowX)) {
      parents.push(parent);
    }
    parent = parent.parentElement;
  }

  return parents;
}

function getOffsetParent(element: Element, container: HTMLElement): Element {
  if (container !== document.body) {
    return container;
  }

  const el = element as HTMLElement;
  let offsetParent = el.offsetParent;

  while (
    offsetParent &&
    window.getComputedStyle(offsetParent).position === "static"
  ) {
    offsetParent = (offsetParent as HTMLElement).offsetParent;
  }

  return offsetParent || document.body;
}

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
    container = defaultOptions.container,
  } = options;

  // Get rects
  const referenceRect = getBoundingClientRect(reference);
  const floatingRect = getBoundingClientRect(floating);
  const containerRect =
    container === document.body
      ? { x: 0, y: 0, width: window.innerWidth, height: window.innerHeight }
      : getBoundingClientRect(container);

  // Get scroll parents and compute total scroll offset
  // For mixed container scenarios, we need to get scroll parents up to document.body
  const scrollParents =
    container === document.body
      ? getScrollParents(reference, document.body)
      : getScrollParents(reference, container);

  // Calculate window scroll position
  const windowScroll = {
    x: window.pageXOffset || document.documentElement.scrollLeft,
    y: window.pageYOffset || document.documentElement.scrollTop,
  };

  // Calculate scroll offsets up to the container or document.body
  const scrollOffset = scrollParents.reduce(
    (offset, parent) => {
      return {
        x: offset.x + (parent.scrollLeft || 0),
        y: offset.y + (parent.scrollTop || 0),
      };
    },
    { x: 0, y: 0 }
  );

  // Initial state
  const state: ComputePositionState = {
    x: 0,
    y: 0,
    strategy,
    placement,
    elements: { reference, floating, container },
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

  // Adjust position based on strategy and container
  if (strategy === "absolute") {
    if (container === document.body) {
      // For body container or mixed scenarios (Container → Body),
      // we need to account for all scroll offsets up to document.body
      state.x = x + windowScroll.x + scrollOffset.x;
      state.y = y + windowScroll.y + scrollOffset.y;
    } else {
      // For container-only scenarios
      state.x = x - containerRect.x + scrollOffset.x;
      state.y = y - containerRect.y + scrollOffset.y;
    }
  } else {
    // For fixed positioning, use viewport-relative coordinates
    state.x = x;
    state.y = y;
  }

  // Run middleware
  for (const { fn } of middleware) {
    const nextState = await fn(state);
    if (nextState.middlewareData) {
      state.middlewareData = {
        ...state.middlewareData,
        ...nextState.middlewareData,
      };
      delete nextState.middlewareData;
    }
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
