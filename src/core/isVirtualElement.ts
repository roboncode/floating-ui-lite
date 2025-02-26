import { VirtualElement } from "../types";

/**
 * Type guard to check if an element is a virtual element
 */
export function isVirtualElement(
  element: Element | VirtualElement
): element is VirtualElement {
  return "getBoundingClientRect" in element && "contextElement" in element;
}
