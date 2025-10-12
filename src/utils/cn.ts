/**
 * Combines class names, handling arrays and falsy values.
 * @param inputs Array of class names or arrays of class names, can contain falsy values
 * @returns Combined class names string
 */
export function cn(
  ...inputs: Array<string | false | null | undefined | 0 | '' | string[]>
): string {
  return inputs.flat().filter(Boolean).join(' ');
}
