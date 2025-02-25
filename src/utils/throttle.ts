export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let inThrottle = false;
  let lastResult: ReturnType<T>;

  return async function (
    this: any,
    ...args: Parameters<T>
  ): Promise<ReturnType<T>> {
    if (!inThrottle) {
      lastResult = await Promise.resolve(func.apply(this, args));
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
    return lastResult;
  };
}
