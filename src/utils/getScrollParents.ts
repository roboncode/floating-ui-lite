import { isFixedPosition } from "../core/isFixedPosition";
import { isScrollable } from "../core/isScrollable";
import { isVirtualElement } from "../core/isVirtualElement";
import { VirtualElement } from "../types";

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
