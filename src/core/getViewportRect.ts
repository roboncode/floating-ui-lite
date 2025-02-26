import { Rect } from "../types";

/**
 * Gets the viewport dimensions as a Rect
 */
export const getViewportRect = (): Rect => ({
  x: 0,
  y: 0,
  width: window.innerWidth,
  height: window.innerHeight,
});
