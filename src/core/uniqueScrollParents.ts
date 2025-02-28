import { getScrollParents } from "./getScrollParents";
import { getUniqueElements } from "./uniqueElements";

/**
 * Returns an array of unique scroll parents for both reference and floating elements
 */
export const getUniqueScrollParents = (
  reference: HTMLElement,
  floating: HTMLElement
): Element[] => {
  return getUniqueElements([
    getScrollParents(reference, document.body),
    getScrollParents(floating, document.body),
  ]);
};
