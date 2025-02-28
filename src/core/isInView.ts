import { isInScrollableView } from "./isInScrollableView";
import { isInViewport } from "./isInViewport";

/**
 * Checks if an element is visible in both the viewport and its scrollable containers
 */
export function isInView(element: HTMLElement): boolean {
  return isInViewport(element) && isInScrollableView(element);
}
