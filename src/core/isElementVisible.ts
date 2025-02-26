/**
 * Checks if an element is actually visible in the DOM
 */
export function isElementVisible(element: HTMLElement): boolean {
  if (!element.isConnected) return false;

  const style = getComputedStyle(element);
  return (
    style.display !== "none" &&
    style.visibility !== "hidden" &&
    style.opacity !== "0" &&
    element.getBoundingClientRect().width > 0
  );
}
