/**
 * Gets the element's dimensions including padding and border
 */
export function getElementDimensions(element: Element): {
  width: number;
  height: number;
} {
  const styles = getComputedStyle(element);
  const paddingX =
    parseFloat(styles.paddingLeft) + parseFloat(styles.paddingRight);
  const paddingY =
    parseFloat(styles.paddingTop) + parseFloat(styles.paddingBottom);
  const borderX =
    parseFloat(styles.borderLeftWidth) + parseFloat(styles.borderRightWidth);
  const borderY =
    parseFloat(styles.borderTopWidth) + parseFloat(styles.borderBottomWidth);

  return {
    width: element.clientWidth + paddingX + borderX,
    height: element.clientHeight + paddingY + borderY,
  };
}
