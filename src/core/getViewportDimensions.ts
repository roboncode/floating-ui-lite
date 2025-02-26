/**
 * Gets the viewport dimensions using window.innerWidth/Height
 * This is more reliable than clientWidth/Height as it includes scrollbars
 */
export function getViewportDimensions(): { width: number; height: number } {
  return { width: window.innerWidth, height: window.innerHeight };
}
