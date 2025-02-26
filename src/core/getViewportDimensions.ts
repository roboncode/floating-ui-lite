/**
 * Gets the viewport dimensions
 */
export function getViewportDimensions(): { width: number; height: number } {
  return {
    width: document.documentElement.clientWidth,
    height: document.documentElement.clientHeight,
  };
}
