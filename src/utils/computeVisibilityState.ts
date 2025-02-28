import { isElementVisible } from "../core/isElementVisible";
import { isInView } from "../core/isInView";
import { VisibilityState } from "../types";

/**
 * Computes the visibility state for reference and floating elements
 * @param reference - Reference element
 * @param floating - Floating element
 * @returns Current visibility state
 */
export const computeVisibilityState = (
  reference: HTMLElement,
  floating: HTMLElement,
): VisibilityState => {
  return {
    isReferenceVisible: isElementVisible(reference) && isInView(reference),
    isFloatingVisible: isElementVisible(floating),
    isReferenceInView: isInView(reference),
    isFloatingInView: isInView(floating),
  };
};
