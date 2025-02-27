/**
 * Returns an array of unique elements from multiple arrays
 * @param arrays - Arrays to get unique elements from
 * @returns Array of unique elements
 */
export const getUniqueElements = <T>(arrays: T[][]): T[] => {
  return [...new Set(arrays.flat())];
};
