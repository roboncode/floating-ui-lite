import { VisibilityState } from "../types";
import { isElementVisible } from "../core/isElementVisible";
import { isInViewport } from "../core/isInViewport";

/**
 * Computes the visibility state for reference and floating elements
 * @param reference - Reference element
 * @param floating - Floating element
 * @returns Current visibility state
 */
export const computeVisibilityState = (
  reference: HTMLElement,
  floating: HTMLElement
): VisibilityState => {
  return {
    isReferenceVisible: isElementVisible(reference),
    isFloatingVisible: isElementVisible(floating),
    isWithinViewport: isInViewport(reference) || isInViewport(floating),
  };
};
