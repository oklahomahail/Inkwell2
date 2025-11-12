/**
 * Project-level Document Formatting & Typesetting (v0.10.0+)
 *
 * Type definitions for project-level typography, layout, and export formatting.
 * Enables authors to configure consistent typesetting across editor, preview, and exports.
 */

/**
 * Chapter header styling configuration
 */
export interface ChapterHeaderStyle {
  fontFamily?: string;
  fontSize?: number; // rem
  fontWeight?: number | 'normal' | 'bold';
  alignment?: 'left' | 'center' | 'right';
  uppercase?: boolean;
  numbering?: 'none' | 'arabic' | 'roman' | 'words';
  prefix?: string; // e.g., "Chapter "
  spacingAbove?: number; // rem
  spacingBelow?: number; // rem
  divider?: {
    show: boolean;
    pattern?: 'none' | 'rule' | 'ornament';
  };
}

/**
 * Complete project formatting configuration
 */
export interface ProjectFormatting {
  version: 1;
  fontFamily: string; // e.g., 'Inter', 'Literata', 'PT Serif'
  fontSize: number; // rem base (1.0 = 16px)
  lineHeight: number; // 1.2–2.0 typical
  paragraphSpacing: number; // rem after <p>
  firstLineIndent?: number; // rem for traditional book layout
  margin?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  }; // rem (for preview/print)
  pageWidth?: number; // rem (for preview)
  pageHeight?: number; // rem (for preview)
  chapterHeader: ChapterHeaderStyle;
}

/**
 * Default formatting configuration
 * Uses professional manuscript-style defaults with Literata serif font
 */
export const DEFAULT_FORMATTING: ProjectFormatting = {
  version: 1,
  fontFamily: 'Literata',
  fontSize: 1.0,
  lineHeight: 1.6,
  paragraphSpacing: 0.8,
  firstLineIndent: 1.25,
  margin: { top: 3, right: 2, bottom: 3, left: 2 },
  pageWidth: 48, // ~768px @ 16px base
  pageHeight: 68, // visual preview only
  chapterHeader: {
    fontFamily: 'Literata',
    fontSize: 1.75,
    fontWeight: 700,
    alignment: 'center',
    uppercase: false,
    numbering: 'arabic',
    prefix: 'Chapter ',
    spacingAbove: 1.5,
    spacingBelow: 0.75,
    divider: { show: false, pattern: 'none' },
  },
};

/**
 * Available font families for formatting
 * All fonts must be available offline via local bundling or Service Worker cache
 */
export const AVAILABLE_FONTS = [
  'Inter',
  'Source Sans 3',
  'Literata',
  'Merriweather',
  'PT Serif',
  'IBM Plex Serif',
  'EB Garamond',
] as const;

export type AvailableFont = (typeof AVAILABLE_FONTS)[number];

/**
 * Font fallback stacks for offline reliability
 */
export const FONT_FALLBACKS: Record<string, string> = {
  Inter: "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  'Source Sans 3':
    "'Source Sans 3', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  Literata: "Literata, Georgia, 'Times New Roman', serif",
  Merriweather: "Merriweather, Georgia, 'Times New Roman', serif",
  'PT Serif': "'PT Serif', Georgia, 'Times New Roman', serif",
  'IBM Plex Serif': "'IBM Plex Serif', Georgia, 'Times New Roman', serif",
  'EB Garamond': "'EB Garamond', Georgia, 'Times New Roman', serif",
};
