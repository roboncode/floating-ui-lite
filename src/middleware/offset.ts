import { ComputePositionState, Middleware } from "../types";

import { shouldSkipMiddleware } from "../utils/shouldSkipMiddleware";

export function offset(value = 0): Middleware {
  return {
    name: "offset",
    async fn(state: ComputePositionState) {
      if (shouldSkipMiddleware(state)) {
        return {};
      }
      // // Skip processing if elements are not visible or not in viewport
      // if (
      //   state.visibilityState &&
      //   (!state.visibilityState.isReferenceVisible ||
      //     !state.visibilityState.isFloatingVisible ||
      //     !state.visibilityState.isWithinViewport)
      // ) {
      //   return {};
      // }

      const { placement } = state;
      const [mainAxis] = placement.split("-");

      let x = state.x;
      let y = state.y;

      switch (mainAxis) {
        case "top":
          y -= value;
          break;
        case "bottom":
          y += value;
          break;
        case "left":
          x -= value;
          break;
        case "right":
          x += value;
          break;
      }

      return {
        x,
        y,
        middlewareData: {
          ...state.middlewareData,
          offset: { value },
        },
      };
    },
  };
}
