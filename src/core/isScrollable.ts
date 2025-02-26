/**
 * Checks if an element has scrollable overflow
 */
export function isScrollable(element: Element): boolean {
  const computedStyle = window.getComputedStyle(element);
  const overflow =
    computedStyle.overflow + computedStyle.overflowX + computedStyle.overflowY;
  return /(auto|scroll|overlay)/.test(overflow);
}
