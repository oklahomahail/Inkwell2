/**
 * Export Helpers for Document Formatting
 *
 * Utilities to apply formatting to various export formats (HTML, EPUB, DOCX, PDF)
 */

import type { ProjectFormatting } from '@/types/formatting';

import { formatToCSS } from './formatToCSS';

/**
 * Generate complete HTML document with formatting
 * Used for HTML exports and as a base for EPUB/PDF
 *
 * @param content - HTML content to wrap
 * @param formatting - Project formatting configuration
 * @param title - Document title
 * @returns Complete HTML document string
 */
export function generateFormattedHTML(
  content: string,
  formatting: ProjectFormatting,
  title: string = 'Untitled Document'
): string {
  const css = formatToCSS(formatting);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
${css}

/* Additional export-specific styles */
body {
  margin: 0;
  padding: 0;
  background: white;
  color: #000;
}

.document-container {
  max-width: var(--ink-page-width);
  margin: 0 auto;
  padding: var(--ink-margin-top) var(--ink-margin-right) var(--ink-margin-bottom) var(--ink-margin-left);
}

@media print {
  .document-container {
    max-width: none;
    margin: 0;
  }
}
  </style>
</head>
<body class="inkwell-project-scope">
  <div class="document-container preview-content">
${content}
  </div>
</body>
</html>`;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Generate CSS for EPUB embedding
 * EPUB has specific requirements for CSS
 */
export function generateEPUBCSS(formatting: ProjectFormatting): string {
  const css = formatToCSS(formatting);

  // EPUB-specific additions
  const epubStyles = `
/* EPUB-specific resets and enhancements */
body {
  margin: 0;
  padding: 1em;
  font-family: var(--ink-font-family);
  font-size: var(--ink-font-size);
  line-height: var(--ink-line-height);
}

/* Ensure images are responsive */
img {
  max-width: 100%;
  height: auto;
}

/* Page breaks for chapters */
.inkwell-ch {
  page-break-before: always;
  -webkit-column-break-before: always;
  break-before: always;
}

.inkwell-ch:first-child {
  page-break-before: avoid;
  -webkit-column-break-before: avoid;
  break-before: avoid;
}
`;

  return css + '\n' + epubStyles;
}

/**
 * Generate DOCX-compatible style configuration
 * Maps formatting to docx library style objects
 */
export interface DOCXStyleConfig {
  normal: {
    font: string;
    size: number; // half-points
    lineRule: number; // 240 = single, 360 = 1.5, 480 = double
    spaceAfter: number; // twips
    firstLineIndent: number; // twips
  };
  heading1: {
    font: string;
    size: number; // half-points
    bold: boolean;
    alignment: 'left' | 'center' | 'right';
    caps: boolean;
    spaceBefore: number; // twips
    spaceAfter: number; // twips
  };
}

/**
 * Convert formatting to DOCX style configuration
 */
export function formatToDOCXStyles(formatting: ProjectFormatting): DOCXStyleConfig {
  const baseSize = 16; // px

  // Helper conversions
  const remToHalfPt = (rem: number) => Math.round(rem * baseSize * 0.75 * 2);
  const remToTwips = (rem: number) => Math.round(rem * baseSize * 15); // 1px ≈ 15 twips

  const ch = formatting.chapterHeader;

  return {
    normal: {
      font: formatting.fontFamily,
      size: remToHalfPt(formatting.fontSize),
      lineRule: Math.round(formatting.lineHeight * 240), // Word line spacing
      spaceAfter: remToTwips(formatting.paragraphSpacing),
      firstLineIndent: remToTwips(formatting.firstLineIndent ?? 0),
    },
    heading1: {
      font: ch.fontFamily || formatting.fontFamily,
      size: remToHalfPt(ch.fontSize ?? 1.75),
      bold: typeof ch.fontWeight === 'number' ? ch.fontWeight >= 600 : ch.fontWeight === 'bold',
      alignment: ch.alignment ?? 'center',
      caps: ch.uppercase ?? false,
      spaceBefore: remToTwips(ch.spacingAbove ?? 1.5),
      spaceAfter: remToTwips(ch.spacingBelow ?? 0.75),
    },
  };
}

/**
 * Generate PDF configuration
 * For use with pdf-lib or HTML-to-PDF pipeline
 */
export interface PDFConfig {
  pageSize: 'A4' | 'LETTER' | 'CUSTOM';
  margins: {
    top: number; // inches
    right: number;
    bottom: number;
    left: number;
  };
  baseFont: string;
  baseFontSize: number; // pt
  lineHeight: number;
}

/**
 * Convert formatting to PDF configuration
 */
export function formatToPDFConfig(formatting: ProjectFormatting): PDFConfig {
  const baseSize = 16; // px
  const remToPt = (rem: number) => rem * baseSize * 0.75;
  const remToInches = (rem: number) => (rem * baseSize) / 96; // 96 DPI

  return {
    pageSize: 'LETTER',
    margins: {
      top: remToInches(formatting.margin?.top ?? 3),
      right: remToInches(formatting.margin?.right ?? 2),
      bottom: remToInches(formatting.margin?.bottom ?? 3),
      left: remToInches(formatting.margin?.left ?? 2),
    },
    baseFont: formatting.fontFamily,
    baseFontSize: remToPt(formatting.fontSize),
    lineHeight: formatting.lineHeight,
  };
}

/**
 * Validate formatting configuration
 * Returns array of warning messages if any values are out of recommended range
 */
export function validateFormatting(formatting: ProjectFormatting): string[] {
  const warnings: string[] = [];

  // Check font size
  if (formatting.fontSize < 0.75 || formatting.fontSize > 1.5) {
    warnings.push('Font size is outside recommended range (0.75rem - 1.5rem)');
  }

  // Check line height
  if (formatting.lineHeight < 1.2 || formatting.lineHeight > 2.5) {
    warnings.push('Line height is outside recommended range (1.2 - 2.5)');
  }

  // Check chapter header size relative to body
  const chSize = formatting.chapterHeader.fontSize ?? 1.75;
  if (chSize <= formatting.fontSize) {
    warnings.push('Chapter header size should be larger than body text');
  }

  // Check margins for print
  if (formatting.margin) {
    if (formatting.margin.top < 1 || formatting.margin.bottom < 1) {
      warnings.push('Top/bottom margins below 1rem may cause issues in print');
    }
    if (formatting.margin.left < 1 || formatting.margin.right < 1) {
      warnings.push('Left/right margins below 1rem may cause issues in print');
    }
  }

  return warnings;
}
