/**
 * Checks if an element has fixed positioning
 */
export function isFixedPosition(element: Element): boolean {
  return window.getComputedStyle(element).position === "fixed";
}
