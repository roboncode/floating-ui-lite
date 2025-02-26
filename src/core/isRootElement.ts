/**
 * Checks if an element is the root element (html)
 */
export function isRootElement(element: Element): boolean {
  return element === document.documentElement;
}
