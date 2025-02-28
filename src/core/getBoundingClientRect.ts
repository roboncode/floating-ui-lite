// import { Rect } from "../types";
import { RectCacheManager } from "./rectCache";

/**
 * Gets the bounding client rect of an element with additional properties
 */
export function getBoundingClientRect(element: Element): DOMRect {
  return RectCacheManager.getBoundingClientRect(element);
  // return {
  //   top: rect.top,
  //   left: rect.left,
  //   right: rect.right,
  //   bottom: rect.bottom,
  //   width: rect.width,
  //   height: rect.height,
  // };
}
