import { getBoundingClientRect } from "./getBoundingClientRect";
import { getScrollParents } from "./getScrollParents";

/**
 * Checks if an element is visible within its scrollable containers
 */
export function isInScrollableView(element: HTMLElement): boolean {
  const rect = getBoundingClientRect(element);
  const scrollParents = getScrollParents(element, document.body);
  const THRESHOLD = 1; // 1px threshold for rounding errors

  for (const parent of scrollParents) {
    if (parent === document.body) continue; // Skip body as it's handled by isInViewport

    const parentRect = getBoundingClientRect(parent);
    const computedStyle = getComputedStyle(parent);
    const parentBorderTop = parseFloat(computedStyle.borderTopWidth) || 0;
    const parentBorderLeft = parseFloat(computedStyle.borderLeftWidth) || 0;
    const parentBorderRight = parseFloat(computedStyle.borderRightWidth) || 0;
    const parentBorderBottom = parseFloat(computedStyle.borderBottomWidth) || 0;

    // Calculate the visible area within the parent's content box (excluding borders)
    const parentTop = parentRect.top + parentBorderTop;
    const parentBottom = parentRect.bottom - parentBorderBottom;
    const parentLeft = parentRect.left + parentBorderLeft;
    const parentRight = parentRect.right - parentBorderRight;

    // Check if the element is at least partially visible within the parent's content area
    // Add small threshold to account for rounding errors
    const isVisible =
      rect.top - THRESHOLD < parentBottom &&
      rect.bottom + THRESHOLD > parentTop &&
      rect.left - THRESHOLD < parentRight &&
      rect.right + THRESHOLD > parentLeft;

    if (!isVisible) {
      return false;
    }
  }

  return true;
}
