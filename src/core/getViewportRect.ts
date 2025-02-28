// import { Rect } from "../types";
import { getViewportDimensions } from "./getViewportDimensions";

/**
 * Gets the viewport rect (position and dimensions)
 * Uses getViewportDimensions for consistent dimension values
 */
export const getViewportRect = (): Pick<
  DOMRect,
  "x" | "y" | "width" | "height"
> => {
  const { width, height } = getViewportDimensions();
  return { x: 0, y: 0, width, height };
};
