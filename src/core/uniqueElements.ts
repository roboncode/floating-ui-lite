/**
 * Returns an array of unique elements from multiple arrays
 */
export const getUniqueElements = <T>(arrays: T[][]): T[] => {
  return [...new Set(arrays.flat())];
};
