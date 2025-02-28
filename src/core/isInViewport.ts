import { getViewportDimensions } from "./getViewportDimensions";

/**
 * Checks if an element is currently visible in the viewport
 */
export function isInViewport(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  const { width: viewportWidth, height: viewportHeight } =
    getViewportDimensions();

  return (
    rect.top <= viewportHeight &&
    rect.bottom >= 0 &&
    rect.left <= viewportWidth &&
    rect.right >= 0
  );
}
