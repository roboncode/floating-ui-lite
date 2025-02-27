import { ComputePositionState, Middleware } from "../types";

/**
 * Options for the hide middleware.
 *
 * @param strategy - The strategy to use for hiding the floating element.
 * @param strategy.referenceHidden - Hide the floating element when the reference element is hidden.
 * @param strategy.escaped - Hide the floating element when it is outside the viewport.
 */
interface HideOptions {
  strategy?: "referenceHidden" | "escaped";
}

// interface HideData {
//   isHidden: boolean;
// }

/**
 * Hide middleware that determines when to hide the floating element based on
 * visibility data from autoUpdate.
 */
export function hide(options: HideOptions = {}): Middleware {
  return {
    name: "hide",
    async fn(state: ComputePositionState) {
      const { strategy = "referenceHidden" } = options;
      const visibilityState = state.visibilityState;

      // Default to visible if no visibility state is available
      if (!visibilityState) {
        return {
          middlewareData: {
            ...state.middlewareData,
            hide: {
              isHidden: false,
            },
          },
        };
      }

      const isHidden =
        strategy === "referenceHidden"
          ? !visibilityState.isReferenceVisible
          : !visibilityState.isWithinViewport;

      console.log(
        `Hide middleware strategy: ${strategy}, isHidden: ${isHidden}`
      );

      return {
        middlewareData: {
          ...state.middlewareData,
          hide: {
            isHidden,
          },
        },
      };
    },
  };
}
