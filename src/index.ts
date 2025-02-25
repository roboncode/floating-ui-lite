export { computePosition } from "./core/computePosition";
export { arrow } from "./middleware/arrow";
export { autoPlacement } from "./middleware/auto-placement";
export { autoUpdate } from "./middleware/auto-update";
export { flip } from "./middleware/flip";
export { offset } from "./middleware/offset";
export { placement } from "./middleware/placement";
export { shift } from "./middleware/shift";
export { size } from "./middleware/size";
export { virtual } from "./middleware/virtual";

export type {
  ComputePositionOptions,
  ComputePositionState,
  Coords,
  Dimensions,
  Elements,
  FloatingOptions,
  Middleware,
  MiddlewareOptions,
  Placement,
  Rect,
  Strategy,
  VirtualElement,
} from "./types";
