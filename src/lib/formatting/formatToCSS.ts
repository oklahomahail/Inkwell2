/**
 * CSS Generation Utilities
 *
 * Convert ProjectFormatting to CSS for exports (HTML, EPUB)
 */

import type { ProjectFormatting } from '@/types/formatting';

/**
 * Generate complete CSS from formatting configuration
 * Used for HTML/EPUB exports to ensure visual consistency
 *
 * @param formatting - Project formatting configuration
 * @returns CSS string with variables and scoped styles
 */
export function formatToCSS(formatting: ProjectFormatting): string {
  const lines: string[] = [];
  const f = formatting;
  const ch = f.chapterHeader;

  // CSS Variables
  lines.push(':root, .inkwell-project-scope {');
  lines.push(`  --ink-font-family: ${JSON.stringify(f.fontFamily)};`);
  lines.push(`  --ink-font-size: ${f.fontSize}rem;`);
  lines.push(`  --ink-line-height: ${f.lineHeight};`);
  lines.push(`  --ink-para-spacing: ${f.paragraphSpacing}rem;`);
  lines.push(`  --ink-first-indent: ${f.firstLineIndent ?? 0}rem;`);

  if (f.margin) {
    lines.push(`  --ink-margin-top: ${f.margin.top}rem;`);
    lines.push(`  --ink-margin-right: ${f.margin.right}rem;`);
    lines.push(`  --ink-margin-bottom: ${f.margin.bottom}rem;`);
    lines.push(`  --ink-margin-left: ${f.margin.left}rem;`);
  }

  lines.push(`  --ink-page-width: ${f.pageWidth ?? 48}rem;`);
  lines.push(`  --ink-page-height: ${f.pageHeight ?? 68}rem;`);

  lines.push(`  --ink-ch-font: ${JSON.stringify(ch.fontFamily || f.fontFamily)};`);
  lines.push(`  --ink-ch-size: ${ch.fontSize ?? 1.75}rem;`);
  lines.push(`  --ink-ch-weight: ${ch.fontWeight ?? 700};`);
  lines.push(`  --ink-ch-space-above: ${ch.spacingAbove ?? 1.5}rem;`);
  lines.push(`  --ink-ch-space-below: ${ch.spacingBelow ?? 0.75}rem;`);
  lines.push('}');
  lines.push('');

  // Content styling
  lines.push('.inkwell-project-scope .editor-content,');
  lines.push('.inkwell-project-scope .preview-content {');
  lines.push('  font-family: var(--ink-font-family);');
  lines.push('  font-size: var(--ink-font-size);');
  lines.push('  line-height: var(--ink-line-height);');
  lines.push('}');
  lines.push('');

  // Paragraph styling
  lines.push('.inkwell-project-scope .editor-content p,');
  lines.push('.inkwell-project-scope .preview-content p {');
  lines.push('  margin: 0 0 var(--ink-para-spacing) 0;');
  if (f.firstLineIndent && f.firstLineIndent > 0) {
    lines.push('  text-indent: var(--ink-first-indent);');
  }
  lines.push('}');
  lines.push('');

  // No indent on first paragraph after header
  if (f.firstLineIndent && f.firstLineIndent > 0) {
    lines.push('.inkwell-project-scope .inkwell-ch + p {');
    lines.push('  text-indent: 0;');
    lines.push('}');
    lines.push('');
  }

  // Chapter headers
  lines.push('.inkwell-ch {');
  lines.push('  font-family: var(--ink-ch-font);');
  lines.push('  font-size: var(--ink-ch-size);');
  lines.push('  font-weight: var(--ink-ch-weight);');
  lines.push('  margin-top: var(--ink-ch-space-above);');
  lines.push('  margin-bottom: var(--ink-ch-space-below);');
  lines.push('  line-height: 1.2;');
  if (ch.alignment) {
    lines.push(`  text-align: ${ch.alignment};`);
  }
  if (ch.uppercase) {
    lines.push('  text-transform: uppercase;');
  }
  lines.push('}');
  lines.push('');

  // Divider styling if enabled
  if (ch.divider?.show) {
    lines.push('.inkwell-ch-divider {');
    lines.push('  margin: 1rem auto;');
    if (ch.divider.pattern === 'ornament') {
      lines.push('  border: none;');
      lines.push('  text-align: center;');
      lines.push('  opacity: 0.5;');
      lines.push('}');
      lines.push('.inkwell-ch-divider::before {');
      lines.push("  content: '❦';");
      lines.push('  font-size: 1.5rem;');
    } else {
      lines.push('  border: none;');
      lines.push('  border-top: 1px solid currentColor;');
      lines.push('  opacity: 0.3;');
      lines.push('  width: 33%;');
    }
    lines.push('}');
  }

  return lines.join('\n');
}

/**
 * Generate inline styles for a specific element
 * Useful for PDF generation where CSS variables may not be supported
 */
export function formatToInlineStyles(formatting: ProjectFormatting): Record<string, string> {
  return {
    fontFamily: formatting.fontFamily,
    fontSize: `${formatting.fontSize}rem`,
    lineHeight: `${formatting.lineHeight}`,
  };
}

/**
 * Convert rem to pixels (for export formats that need absolute units)
 * @param rem - Value in rem
 * @param baseSize - Base font size in pixels (default: 16)
 */
export function remToPx(rem: number, baseSize: number = 16): number {
  return rem * baseSize;
}

/**
 * Convert rem to points (for DOCX/PDF)
 * @param rem - Value in rem
 * @param baseSize - Base font size in pixels (default: 16)
 */
export function remToPt(rem: number, baseSize: number = 16): number {
  const px = remToPx(rem, baseSize);
  return px * 0.75; // 1px = 0.75pt
}

/**
 * Convert rem to half-points (for DOCX API)
 * @param rem - Value in rem
 * @param baseSize - Base font size in pixels (default: 16)
 */
export function remToHalfPt(rem: number, baseSize: number = 16): number {
  return Math.round(remToPt(rem, baseSize) * 2);
}

/**
 * Convert rem to twips (twentieths of a point, for DOCX)
 * @param rem - Value in rem
 * @param baseSize - Base font size in pixels (default: 16)
 */
export function remToTwips(rem: number, baseSize: number = 16): number {
  return Math.round(remToPt(rem, baseSize) * 20);
}
