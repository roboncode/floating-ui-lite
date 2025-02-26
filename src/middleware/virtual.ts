import { ComputePositionState, Middleware } from "../types";

import { getScrollParents } from "../core/getScrollParents";

export interface VirtualOptions {
  x?: number;
  y?: number;
  animationFrame?: boolean;
}

function calculateScrollOffset(scrollParents: Element[]): {
  x: number;
  y: number;
} {
  return scrollParents.reduce<{ x: number; y: number }>(
    (offset, parent) => ({
      x: offset.x + (parent.scrollLeft || 0),
      y: offset.y + (parent.scrollTop || 0),
    }),
    { x: 0, y: 0 }
  );
}

/**
 * Virtual middleware that handles positioning for virtual/detached elements
 * and provides additional positioning features like handling scroll and resize
 */
export function virtual(options: VirtualOptions = {}): Middleware {
  return {
    name: "virtual",
    fn: async (state: ComputePositionState) => {
      const { x = 0, y = 0 } = options;

      // Get scroll parents and calculate offset
      const scrollParents = getScrollParents(
        state.elements.reference,
        document.body
      );
      const scrollOffset = calculateScrollOffset(scrollParents);

      return {
        x: state.x + x + scrollOffset.x,
        y: state.y + y + scrollOffset.y,
      };
    },
  };
}
