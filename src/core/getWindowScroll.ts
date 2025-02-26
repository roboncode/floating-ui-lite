/**
 * Gets the current window scroll position
 */
export const getWindowScroll = () => ({
  x: window.pageXOffset || document.documentElement.scrollLeft,
  y: window.pageYOffset || document.documentElement.scrollTop,
});
