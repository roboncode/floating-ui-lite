import { ComputePositionState } from "../types";

/**
 * Determines if a middleware should skip processing based on visibility state
 *
 * This function is used by middlewares to determine if they should process
 * their updates based on the current visibility state of the elements.
 *
 * @param state - The current compute position state
 * @param ignoreVisibility - Optional flag to force processing regardless of visibility
 * @returns true if the middleware should skip processing, false otherwise
 */
export function shouldSkipMiddleware(
  state: ComputePositionState,
  ignoreVisibility = false
): boolean {
  if (ignoreVisibility) {
    return false;
  }

  return !!(
    state.visibilityState &&
    (!state.visibilityState.isReferenceVisible ||
      !state.visibilityState.isFloatingVisible ||
      !state.visibilityState.isReferenceInView ||
      !state.visibilityState.isFloatingInView)
  );
}
