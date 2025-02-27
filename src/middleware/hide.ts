import { ComputePositionState, Middleware } from "../types";

interface HideOptions {
  strategy?: "referenceHidden" | "escaped";
}

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
        console.log(
          "🔍 Hide: No visibility state available, defaulting to visible"
        );
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

      console.log("👁️ Hide:", {
        strategy,
        isHidden,
        visibilityState: {
          isReferenceVisible: visibilityState.isReferenceVisible,
          isFloatingVisible: visibilityState.isFloatingVisible,
          isWithinViewport: visibilityState.isWithinViewport,
        },
      });

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
