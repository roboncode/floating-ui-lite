import { ComputePositionState, Middleware } from "../types";

import { isInViewport } from "../core/isInViewport";

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
  let isHidden = false;

  return {
    name: "hide",
    async fn(state: ComputePositionState) {
      const { strategy = "referenceHidden" } = options;
      const { reference, floating } = state.elements;

      // Always check reference visibility regardless of current state
      const isReferenceInViewport = isInViewport(reference);

      // Only check floating visibility if not hidden
      const isFloatingInViewport =
        !isHidden && floating.parentElement ? isInViewport(floating) : false;

      const data = {
        referenceHidden: !isReferenceInViewport,
        escaped:
          strategy === "escaped"
            ? !isFloatingInViewport && isReferenceInViewport
            : false,
      };

      // Track hidden state for next update
      isHidden =
        data.referenceHidden || (data.escaped && strategy === "escaped");

      console.log(
        "👁️ Hide:",
        JSON.stringify(
          {
            strategy,
            data,
            visibilityState: {
              isReferenceVisible: isReferenceInViewport,
              isFloatingVisible: isFloatingInViewport,
              isWithinViewport: isReferenceInViewport && isFloatingInViewport,
            },
            willHide: isHidden,
          },
          null,
          2
        )
      );

      return {
        middlewareData: {
          ...state.middlewareData,
          hide: data,
        },
      };
    },
  };
}
