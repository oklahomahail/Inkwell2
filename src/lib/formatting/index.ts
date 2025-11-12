/**
 * Document Formatting - Public API
 *
 * Central export point for formatting utilities, types, and helpers
 */

// Type definitions
export type {
  ProjectFormatting,
  ChapterHeaderStyle,
  AvailableFont,
} from '@/types/formatting';

export { DEFAULT_FORMATTING, AVAILABLE_FONTS, FONT_FALLBACKS } from '@/types/formatting';

// Context and hooks
export {
  FormattingProvider,
  useFormatting,
  useFormattingScope,
  type FormattingProviderProps,
} from '@/context/FormattingContext';

// Components
export { ChapterHeader, SimpleChapterHeader } from '@/components/Document/ChapterHeader';
export type { ChapterHeaderProps } from '@/components/Document/ChapterHeader';

// Numbering utilities
export {
  toRoman,
  toRomanLower,
  toWords,
  toWordsCapitalized,
  formatChapterNumber,
} from './numbering';

// CSS generation
export {
  formatToCSS,
  formatToInlineStyles,
  remToPx,
  remToPt,
  remToHalfPt,
  remToTwips,
} from './formatToCSS';

// Export helpers
export type { DOCXStyleConfig, PDFConfig } from './exportHelpers';

export {
  generateFormattedHTML,
  generateEPUBCSS,
  formatToDOCXStyles,
  formatToPDFConfig,
  validateFormatting,
} from './exportHelpers';
