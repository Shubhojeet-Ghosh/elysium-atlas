// Utility functions for comparing values with null/undefined/empty string equivalence

/**
 * Normalize null/undefined/empty values to be treated as equivalent
 * @param value - The value to normalize
 * @returns Normalized value (empty string for null/undefined/empty)
 */
export const normalizeValue = (value: any): any => {
  if (value === null || value === undefined || value === "") {
    return "";
  }
  return value;
};

/**
 * Check if two values are equivalent after normalization
 * @param val1 - First value to compare
 * @param val2 - Second value to compare
 * @returns True if values are equivalent after normalization
 */
export const isEquivalent = (val1: any, val2: any): boolean => {
  return normalizeValue(val1) === normalizeValue(val2);
};

/**
 * Deep comparison function that treats null/undefined/empty strings as equivalent
 * @param obj1 - First object to compare
 * @param obj2 - Second object to compare
 * @returns True if objects are deeply equal with normalized values
 */
export const deepEqualNormalized = (obj1: any, obj2: any): boolean => {
  // Simple deep equality check with normalization
  if (obj1 === obj2) return true;

  // Handle null/undefined/empty string equivalence
  const norm1 = normalizeValue(obj1);
  const norm2 = normalizeValue(obj2);
  if (norm1 === norm2) return true;

  if (typeof obj1 !== typeof obj2) return false;
  if (typeof obj1 !== "object" || obj1 === null || obj2 === null) return false;
  if (Array.isArray(obj1) !== Array.isArray(obj2)) return false;

  if (Array.isArray(obj1)) {
    if (obj1.length !== obj2.length) return false;
    for (let i = 0; i < obj1.length; i++) {
      if (!deepEqualNormalized(obj1[i], obj2[i])) return false;
    }
    return true;
  }

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  if (keys1.length !== keys2.length) return false;

  for (const key of keys1) {
    if (!deepEqualNormalized(obj1[key], obj2[key])) return false;
  }

  return true;
};

/**
 * Filter array items to only include those with status !== "existing"
 * Used to exclude existing/fetched items from change detection
 * For items with status="new", only include them if checked is true
 */
const filterNonExisting = (arr: any[]): any[] => {
  if (!Array.isArray(arr)) return arr;
  return arr.filter((item) => {
    if (typeof item === "object" && item !== null && "status" in item) {
      // Exclude existing items
      if (item.status === "existing") {
        return false;
      }
      // For new items, only include if checked is true
      if (item.status === "new") {
        return item.checked === true;
      }
      return true;
    }
    return true;
  });
};

/**
 * Deep comparison that ignores items with status="existing" in arrays
 * This prevents API-fetched data from triggering unsaved changes
 */
export const deepEqualNormalizedIgnoringExisting = (
  obj1: any,
  obj2: any
): boolean => {
  // Simple deep equality check with normalization
  if (obj1 === obj2) return true;

  // Handle null/undefined/empty string equivalence
  const norm1 = normalizeValue(obj1);
  const norm2 = normalizeValue(obj2);
  if (norm1 === norm2) return true;

  if (typeof obj1 !== typeof obj2) return false;
  if (typeof obj1 !== "object" || obj1 === null || obj2 === null) return false;
  if (Array.isArray(obj1) !== Array.isArray(obj2)) return false;

  if (Array.isArray(obj1)) {
    // Filter out items with status="existing" before comparison
    const filtered1 = filterNonExisting(obj1);
    const filtered2 = filterNonExisting(obj2);

    if (filtered1.length !== filtered2.length) return false;
    for (let i = 0; i < filtered1.length; i++) {
      if (!deepEqualNormalizedIgnoringExisting(filtered1[i], filtered2[i]))
        return false;
    }
    return true;
  }

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  if (keys1.length !== keys2.length) return false;

  for (const key of keys1) {
    if (!deepEqualNormalizedIgnoringExisting(obj1[key], obj2[key]))
      return false;
  }

  return true;
};
