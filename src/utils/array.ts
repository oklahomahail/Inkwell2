/**
 * Filters out falsy values from an array.
 * @param items Array of items that might contain falsy values
 * @returns Array with only truthy values
 */
export function compact<T>(items: Array<T | null | undefined | false | 0 | ''>): T[] {
  return items.filter(Boolean) as T[];
}
