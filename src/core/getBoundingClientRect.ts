import { Rect } from "../types";

/**
 * Gets the bounding client rect of an element with additional properties
 */
export function getBoundingClientRect(element: Element): Rect {
  const rect = element.getBoundingClientRect();
  return {
    width: rect.width,
    height: rect.height,
    x: rect.x,
    y: rect.y,
  };
}
