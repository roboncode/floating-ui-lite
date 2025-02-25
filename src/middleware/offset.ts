import { Middleware } from "../types";

export function offset(value: number = 0): Middleware {
  return {
    name: "offset",
    async fn(state) {
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
