import { ComputePositionState, Middleware } from "../types";

interface HideOptions {
  strategy?: "referenceHidden" | "escaped";
}

/**
 * Hide middleware that determines when to hide the floating element based on
 * visibility data from autoUpdate.
 *
 * When using this middleware, it will continue to receive updates even when
 * the floating element is hidden to ensure proper visibility state management.
 *
 * When using this middleware, it will continue to receive updates even when
 * the floating element is hidden to ensure proper visibility state management.
 */
export function hide(options: HideOptions = {}): Middleware {
  // let isHidden = false;

  return {
    name: "hide",
    async fn(state: ComputePositionState) {
      const { strategy = "referenceHidden" } = options;
      const { isReferenceInView = false, isFloatingInView = false } =
        state.visibilityState || {};

      const data = {
        referenceHidden: !isReferenceInView,
        escaped:
          strategy === "escaped"
            ? !isFloatingInView && isReferenceInView
            : false,
      };

      // // Track hidden state for next update
      // isHidden =
      //   data.referenceHidden || (data.escaped && strategy === "escaped");

      // console.log(
      //   "👁️ Hide:",
      //   JSON.stringify(
      //     {
      //       strategy,
      //       data,
      //       visibilityState: {
      //         isReferenceVisible,
      //         isFloatingVisible,
      //         isReferenceInView,
      //         isFloatingInView,
      //       },
      //       willHide: isHidden,
      //     },
      //     null,
      //     2
      //   )
      // );

      return {
        middlewareData: {
          ...state.middlewareData,
          hide: data,
        },
      };
    },
  };
}
