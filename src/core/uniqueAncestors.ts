import { getParentElements } from "./getParentElements";
import { getUniqueElements } from "./uniqueElements";
import { isRootElement } from "./isRootElement";

/**
 * Returns an array of unique ancestors for both reference and floating elements,
 * excluding root elements
 * @param reference - Reference element
 * @param floating - Floating element
 * @returns Array of unique ancestor elements
 */
export const getUniqueAncestors = (
  reference: HTMLElement,
  floating: HTMLElement
): Element[] => {
  return getUniqueElements([
    getParentElements(reference),
    getParentElements(floating),
  ]).filter((element) => !isRootElement(element));
};
