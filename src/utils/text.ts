/**
 * Text utility functions
 */

/**
 * Count words in a text string
 */
export function countWords(text: string): number {
  const m = text.trim().match(/\S+/g);
  return m ? m.length : 0;
}

/**
 * Count characters (excluding whitespace)
 */
export function countCharacters(text: string): number {
  return text.replace(/\s/g, '').length;
}

/**
 * Estimate reading time in minutes (assumes 200 words per minute)
 */
export function estimateReadingTime(wordCount: number): number {
  return Math.ceil(wordCount / 200);
}
