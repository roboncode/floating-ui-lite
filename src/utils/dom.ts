import { Rect } from "../types";

/**
 * Gets the bounding client rect of an element with additional properties
 */
export function getBoundingClientRect(element: Element): Rect {
  const rect = element.getBoundingClientRect();
  return {
    width: rect.width,
    height: rect.height,
    x: rect.x,
    y: rect.y,
  };
}

/**
 * Checks if an element is the root element (html)
 */
export function isRootElement(element: Element): boolean {
  return element === document.documentElement;
}

/**
 * Gets the scrollable parent of an element
 */
export function getScrollParent(element: Element): Element {
  if (["html", "body", "#document"].includes(element.nodeName.toLowerCase())) {
    return document.documentElement;
  }

  const { overflow, overflowX, overflowY } = getComputedStyle(element);
  const isScrollable = /auto|scroll|overlay|hidden/.test(
    overflow + overflowY + overflowX
  );

  if (isScrollable) {
    return element;
  }

  return getScrollParent(element.parentElement || document.documentElement);
}

/**
 * Gets all parent elements up to the root
 */
export function getParentElements(element: Element): Element[] {
  const parents: Element[] = [];
  let current = element.parentElement;

  while (current) {
    parents.push(current);
    current = current.parentElement;
  }

  return parents;
}

/**
 * Checks if an element contains another element
 */
export function contains(parent: Element, child: Element): boolean {
  return parent.contains(child);
}

/**
 * Gets the viewport dimensions
 */
export function getViewportDimensions(): { width: number; height: number } {
  return {
    width: document.documentElement.clientWidth,
    height: document.documentElement.clientHeight,
  };
}

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
