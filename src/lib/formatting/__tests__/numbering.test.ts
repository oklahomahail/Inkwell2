/**
 * Unit Tests for Chapter Numbering Utilities
 */

import {
  toRoman,
  toRomanLower,
  toWords,
  toWordsCapitalized,
  formatChapterNumber,
} from '../numbering';

describe('toRoman', () => {
  it('converts small numbers correctly', () => {
    expect(toRoman(1)).toBe('I');
    expect(toRoman(2)).toBe('II');
    expect(toRoman(3)).toBe('III');
    expect(toRoman(4)).toBe('IV');
    expect(toRoman(5)).toBe('V');
  });

  it('converts medium numbers correctly', () => {
    expect(toRoman(9)).toBe('IX');
    expect(toRoman(10)).toBe('X');
    expect(toRoman(40)).toBe('XL');
    expect(toRoman(50)).toBe('L');
    expect(toRoman(90)).toBe('XC');
    expect(toRoman(100)).toBe('C');
  });

  it('converts large numbers correctly', () => {
    expect(toRoman(500)).toBe('D');
    expect(toRoman(900)).toBe('CM');
    expect(toRoman(1000)).toBe('M');
    expect(toRoman(1984)).toBe('MCMLXXXIV');
    expect(toRoman(2024)).toBe('MMXXIV');
    expect(toRoman(3999)).toBe('MMMCMXCIX');
  });

  it('handles edge cases', () => {
    expect(toRoman(0)).toBe('');
    expect(toRoman(-1)).toBe('');
    expect(toRoman(4000)).toBe('4000'); // Falls back to string for > 3999
  });

  it('handles non-integers', () => {
    expect(toRoman(3.5)).toBe('');
  });
});

describe('toRomanLower', () => {
  it('converts to lowercase roman numerals', () => {
    expect(toRomanLower(1)).toBe('i');
    expect(toRomanLower(4)).toBe('iv');
    expect(toRomanLower(9)).toBe('ix');
    expect(toRomanLower(2024)).toBe('mmxxiv');
  });
});

describe('toWords', () => {
  it('converts single digits', () => {
    expect(toWords(0)).toBe('zero');
    expect(toWords(1)).toBe('one');
    expect(toWords(5)).toBe('five');
    expect(toWords(9)).toBe('nine');
  });

  it('converts teens', () => {
    expect(toWords(10)).toBe('ten');
    expect(toWords(11)).toBe('eleven');
    expect(toWords(13)).toBe('thirteen');
    expect(toWords(19)).toBe('nineteen');
  });

  it('converts tens', () => {
    expect(toWords(20)).toBe('twenty');
    expect(toWords(30)).toBe('thirty');
    expect(toWords(50)).toBe('fifty');
    expect(toWords(99)).toBe('ninety-nine');
  });

  it('converts hundreds', () => {
    expect(toWords(100)).toBe('one hundred');
    expect(toWords(101)).toBe('one hundred one');
    expect(toWords(250)).toBe('two hundred fifty');
    expect(toWords(999)).toBe('nine hundred ninety-nine');
  });

  it('converts thousands', () => {
    expect(toWords(1000)).toBe('one thousand');
    expect(toWords(1001)).toBe('one thousand one');
    expect(toWords(1234)).toBe('one thousand two hundred thirty-four');
    expect(toWords(10000)).toBe('ten thousand');
    expect(toWords(42000)).toBe('forty-two thousand');
  });

  it('handles edge cases', () => {
    expect(toWords(-1)).toBe('-1'); // Negative numbers fall back to string
    expect(toWords(1000000)).toBe('1000000'); // Very large numbers fall back
  });
});

describe('toWordsCapitalized', () => {
  it('capitalizes first letter', () => {
    expect(toWordsCapitalized(1)).toBe('One');
    expect(toWordsCapitalized(42)).toBe('Forty-two');
    expect(toWordsCapitalized(100)).toBe('One hundred');
  });
});

describe('formatChapterNumber', () => {
  it('formats with arabic style', () => {
    expect(formatChapterNumber(1, 'arabic')).toBe('1');
    expect(formatChapterNumber(42, 'arabic')).toBe('42');
    expect(formatChapterNumber(100, 'arabic')).toBe('100');
  });

  it('formats with roman style', () => {
    expect(formatChapterNumber(1, 'roman')).toBe('I');
    expect(formatChapterNumber(4, 'roman')).toBe('IV');
    expect(formatChapterNumber(10, 'roman')).toBe('X');
  });

  it('formats with words style', () => {
    expect(formatChapterNumber(1, 'words')).toBe('One');
    expect(formatChapterNumber(2, 'words')).toBe('Two');
    expect(formatChapterNumber(42, 'words')).toBe('Forty-two');
  });

  it('formats with none style', () => {
    expect(formatChapterNumber(1, 'none')).toBe('');
    expect(formatChapterNumber(42, 'none')).toBe('');
  });

  it('handles typical chapter sequences', () => {
    // Test a typical book structure
    const styles: Array<'arabic' | 'roman' | 'words'> = ['arabic', 'roman', 'words'];

    styles.forEach((style) => {
      const chapters = Array.from({ length: 30 }, (_, i) => i + 1);
      chapters.forEach((num) => {
        const result = formatChapterNumber(num, style);
        expect(result).toBeTruthy();
        expect(typeof result).toBe('string');
      });
    });
  });
});
