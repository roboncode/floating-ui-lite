import { VirtualElement } from "../types";

function isScrollable(element: Element): boolean {
  const computedStyle = window.getComputedStyle(element);
  const overflow =
    computedStyle.overflow + computedStyle.overflowX + computedStyle.overflowY;
  return /(auto|scroll|overlay)/.test(overflow);
}

function isFixedPosition(element: Element): boolean {
  return window.getComputedStyle(element).position === "fixed";
}

function isVirtualElement(
  element: Element | VirtualElement
): element is VirtualElement {
  return "getBoundingClientRect" in element && "contextElement" in element;
}

export function getScrollParents(element: Element | VirtualElement): Element[] {
  const scrollParents: Element[] = [];

  // Get the starting element
  let currentElement: Element | null = isVirtualElement(element)
    ? element.contextElement || null
    : element;

  // Early return if we don't have a valid element
  if (!currentElement) {
    return [document.body];
  }

  while (currentElement && currentElement !== document.body) {
    if (isScrollable(currentElement) || isFixedPosition(currentElement)) {
      scrollParents.push(currentElement);
    }
    currentElement = currentElement.parentElement;
  }

  // Always add document.body as the last scroll parent
  scrollParents.push(document.body);
  return scrollParents;
}
