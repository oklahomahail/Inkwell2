/**
 * Chapter Numbering Utilities
 *
 * Convert chapter numbers to various formats (arabic, roman, words)
 */

/**
 * Convert number to Roman numerals (uppercase)
 * @example toRoman(4) => "IV"
 * @example toRoman(2024) => "MMXXIV"
 */
export function toRoman(num: number): string {
  if (num <= 0 || !Number.isInteger(num)) return '';
  if (num > 3999) return String(num); // Roman numerals don't go beyond MMMCMXCIX

  const map: [number, string][] = [
    [1000, 'M'],
    [900, 'CM'],
    [500, 'D'],
    [400, 'CD'],
    [100, 'C'],
    [90, 'XC'],
    [50, 'L'],
    [40, 'XL'],
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I'],
  ];

  let n = num;
  let result = '';

  for (const [value, symbol] of map) {
    while (n >= value) {
      result += symbol;
      n -= value;
    }
  }

  return result;
}

/**
 * Convert number to lowercase roman numerals
 * @example toRomanLower(4) => "iv"
 */
export function toRomanLower(num: number): string {
  return toRoman(num).toLowerCase();
}

/**
 * Convert number to English words
 * @example toWords(1) => "one"
 * @example toWords(42) => "forty-two"
 * @example toWords(100) => "one hundred"
 */
export function toWords(num: number): string {
  if (!Number.isInteger(num) || num < 0) return String(num);

  const ones = [
    'zero',
    'one',
    'two',
    'three',
    'four',
    'five',
    'six',
    'seven',
    'eight',
    'nine',
    'ten',
    'eleven',
    'twelve',
    'thirteen',
    'fourteen',
    'fifteen',
    'sixteen',
    'seventeen',
    'eighteen',
    'nineteen',
  ];

  const tens = [
    '',
    '',
    'twenty',
    'thirty',
    'forty',
    'fifty',
    'sixty',
    'seventy',
    'eighty',
    'ninety',
  ];

  if (num < 20) return ones[num] || String(num);

  if (num < 100) {
    const ten = Math.floor(num / 10);
    const one = num % 10;
    return tens[ten] + (one ? '-' + ones[one] : '');
  }

  if (num < 1000) {
    const hundred = Math.floor(num / 100);
    const remainder = num % 100;
    return ones[hundred] + ' hundred' + (remainder ? ' ' + toWords(remainder) : '');
  }

  if (num < 1000000) {
    const thousand = Math.floor(num / 1000);
    const remainder = num % 1000;
    return toWords(thousand) + ' thousand' + (remainder ? ' ' + toWords(remainder) : '');
  }

  // For very large numbers, fall back to digits
  return String(num);
}

/**
 * Capitalize first letter of a string
 */
export function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Convert number to words with first letter capitalized
 * @example toWordsCapitalized(42) => "Forty-two"
 */
export function toWordsCapitalized(num: number): string {
  return capitalize(toWords(num));
}

/**
 * Format a chapter number according to the specified style
 * @param n - The chapter number (1-indexed)
 * @param style - Numbering style
 * @returns Formatted chapter number
 */
export function formatChapterNumber(
  n: number,
  style: 'none' | 'arabic' | 'roman' | 'words'
): string {
  if (style === 'none') return '';
  if (style === 'roman') return toRoman(n);
  if (style === 'words') return toWordsCapitalized(n);
  return String(n); // arabic (default)
}
