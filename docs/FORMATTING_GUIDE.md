# Document Formatting & Typesetting Guide

## Overview

Inkwell's Document Formatting system (v0.10.0+) enables project-level typography and layout configuration that applies consistently across the editor, preview, and all export formats (HTML, EPUB, DOCX, PDF).

## Features

- **Typography Control**: Font family, size, line height, paragraph spacing
- **Chapter Headers**: Configurable numbering (arabic, roman, words), alignment, styling
- **Page Layout**: Margins and dimensions for print preview and exports
- **First-Line Indent**: Traditional book-style paragraph formatting
- **Live Preview**: Real-time updates as you adjust settings
- **Export Consistency**: Formatting automatically applied to all export formats
- **Offline Storage**: Settings persisted locally per project

## Quick Start

### 1. Access Formatting Panel

Navigate to a project and switch to the **Formatting** view from the sidebar or command palette.

### 2. Configure Typography

```typescript
// The FormattingPanel UI provides controls for:
{
  fontFamily: 'Literata',          // Choose from curated list
  fontSize: 1.0,                    // rem (16px base)
  lineHeight: 1.6,                  // 1.2-2.5
  paragraphSpacing: 0.8,            // rem
  firstLineIndent: 1.25,            // rem (traditional book style)
}
```

### 3. Style Chapter Headers

```typescript
{
  chapterHeader: {
    fontFamily: 'Literata',         // Optional: inherit from base
    fontSize: 1.75,                 // rem
    fontWeight: 700,                // or 'bold'
    alignment: 'center',            // 'left' | 'center' | 'right'
    uppercase: false,
    numbering: 'arabic',            // 'none' | 'arabic' | 'roman' | 'words'
    prefix: 'Chapter ',
    spacingAbove: 1.5,              // rem
    spacingBelow: 0.75,             // rem
    divider: {
      show: false,
      pattern: 'rule'               // 'rule' | 'ornament'
    }
  }
}
```

## Developer Integration

### Using FormattingContext

Wrap components that need formatting with the `FormattingProvider`:

```tsx
import { FormattingProvider } from '@/context/FormattingContext';

function YourComponent({ projectId }) {
  return (
    <FormattingProvider projectId={projectId}>
      <YourContent />
    </FormattingProvider>
  );
}
```

### Apply Formatting to Editor/Preview

Use the `useFormattingScope` hook or manually apply CSS variables:

```tsx
import { useFormattingScope } from '@/context/FormattingContext';

function DocumentView() {
  const ref = useFormattingScope<HTMLDivElement>();

  return (
    <div ref={ref} className="inkwell-project-scope">
      <div className="preview-content">
        {/* Your content */}
      </div>
    </div>
  );
}
```

### Using ChapterHeader Component

```tsx
import { ChapterHeader } from '@/components/Document/ChapterHeader';

function ChapterView({ chapter, index }) {
  return (
    <div className="inkwell-project-scope">
      <ChapterHeader
        index={index}           // 0-indexed chapter number
        title={chapter.title}
      />
      <div className="preview-content">
        {chapter.content}
      </div>
    </div>
  );
}
```

### Exporting with Formatting

#### HTML Export

```typescript
import { generateFormattedHTML } from '@/lib/formatting/exportHelpers';
import { useFormatting } from '@/context/FormattingContext';

function exportToHTML() {
  const { formatting } = useFormatting();

  const html = generateFormattedHTML(
    documentContent,
    formatting,
    'My Novel Title'
  );

  // Download or save HTML
}
```

#### EPUB Export

```typescript
import { generateEPUBCSS } from '@/lib/formatting/exportHelpers';

const css = generateEPUBCSS(formatting);
// Add to EPUB package with proper @font-face declarations
```

#### DOCX Export

```typescript
import { formatToDOCXStyles } from '@/lib/formatting/exportHelpers';

const styles = formatToDOCXStyles(formatting);

// Apply to docx library:
const doc = new Document({
  styles: {
    paragraphStyles: [
      {
        id: 'Normal',
        name: 'Normal',
        run: {
          font: styles.normal.font,
          size: styles.normal.size,  // half-points
        },
        paragraph: {
          spacing: {
            after: styles.normal.spaceAfter,  // twips
            line: styles.normal.lineRule,
          },
          indent: {
            firstLine: styles.normal.firstLineIndent,  // twips
          },
        },
      },
      // ... Heading1 style
    ],
  },
});
```

#### PDF Export

```typescript
import { formatToPDFConfig } from '@/lib/formatting/exportHelpers';

const pdfConfig = formatToPDFConfig(formatting);

// Use with HTML-to-PDF pipeline or pdf-lib
```

## CSS Variables Reference

All formatting generates CSS variables that can be used throughout your app:

```css
:root, .inkwell-project-scope {
  /* Typography */
  --ink-font-family: 'Literata', serif;
  --ink-font-size: 1rem;
  --ink-line-height: 1.6;
  --ink-para-spacing: 0.8rem;
  --ink-first-indent: 1.25rem;

  /* Page Layout */
  --ink-margin-top: 3rem;
  --ink-margin-right: 2rem;
  --ink-margin-bottom: 3rem;
  --ink-margin-left: 2rem;
  --ink-page-width: 48rem;
  --ink-page-height: 68rem;

  /* Chapter Headers */
  --ink-ch-font: var(--ink-font-family);
  --ink-ch-size: 1.75rem;
  --ink-ch-weight: 700;
  --ink-ch-space-above: 1.5rem;
  --ink-ch-space-below: 0.75rem;
}
```

## Available Fonts

The following fonts are included and optimized for offline use:

- **Inter** - Modern sans-serif
- **Source Sans 3** - Clean sans-serif
- **Literata** - Professional serif (default)
- **Merriweather** - Readable serif
- **PT Serif** - Classic serif
- **IBM Plex Serif** - Technical serif
- **EB Garamond** - Traditional serif

### Adding Custom Fonts

1. Add WOFF2 font files to `public/fonts/`
2. Update `AVAILABLE_FONTS` in [src/types/formatting.ts](../src/types/formatting.ts)
3. Add `@font-face` declarations in [src/styles/formatting.css](../src/styles/formatting.css)
4. Add fallback stack to `FONT_FALLBACKS`

## Numbering Utilities

Chapter numbering is handled by utilities in [src/lib/formatting/numbering.ts](../src/lib/formatting/numbering.ts):

```typescript
import { formatChapterNumber } from '@/lib/formatting/numbering';

formatChapterNumber(1, 'arabic');  // "1"
formatChapterNumber(4, 'roman');   // "IV"
formatChapterNumber(2, 'words');   // "Two"
formatChapterNumber(5, 'none');    // ""
```

### Supported Formats

- **arabic**: 1, 2, 3, 4, 5...
- **roman**: I, II, III, IV, V... (uppercase)
- **words**: One, Two, Three... (capitalized)
- **none**: No numbering

## Storage & Persistence

Formatting is stored per-project in localStorage:

```
Key: inkwell:project:formatting:{projectId}
Value: JSON-serialized ProjectFormatting object
```

Data syncs to Supabase (when online) for cross-device consistency.

## Print & Export Previews

Apply the `inkwell-page-preview` class for paginated preview:

```tsx
<div className="inkwell-page-preview inkwell-project-scope">
  <div className="preview-content">
    {/* Content with margins and page dimensions */}
  </div>
</div>
```

This applies:
- Page dimensions (`--ink-page-width`, `--ink-page-height`)
- Margins (`--ink-margin-*`)
- White background
- Print-ready styles

## Validation

Use `validateFormatting` to check for common issues:

```typescript
import { validateFormatting } from '@/lib/formatting/exportHelpers';

const warnings = validateFormatting(formatting);
if (warnings.length > 0) {
  console.warn('Formatting issues:', warnings);
}
```

## Best Practices

1. **Font Size**: Keep between 0.9-1.2rem for readability
2. **Line Height**: 1.4-1.8 works well for most body text
3. **Paragraph Spacing**: 0.5-1.0rem balances density and clarity
4. **First-Line Indent**: 1.0-1.5rem for traditional book style, or 0 for modern web style
5. **Margins**: Minimum 1rem for print compatibility
6. **Chapter Headers**: 1.5-2.5× body size for clear hierarchy

## Troubleshooting

### Formatting not applying in preview

1. Ensure your container has the `inkwell-project-scope` class
2. Content must be wrapped in `preview-content` or `editor-content` class
3. Check that FormattingProvider is in the component tree

### Fonts not loading offline

1. Verify `@font-face` declarations in `formatting.css`
2. Check Service Worker is caching font files
3. Ensure fallback fonts are available

### Export formatting doesn't match preview

1. Verify `formatToCSS` generates correct variables
2. Check DOCX/PDF conversion units (rem → pt → twips)
3. Test with `generateFormattedHTML` first

## API Reference

### Types

- `ProjectFormatting` - Complete formatting configuration
- `ChapterHeaderStyle` - Chapter header styling options
- `DOCXStyleConfig` - DOCX export style mapping
- `PDFConfig` - PDF export configuration

### Hooks

- `useFormatting()` - Access formatting state and actions
- `useFormattingScope<T>()` - Get ref with formatting applied

### Components

- `<ChapterHeader />` - Formatted chapter title with numbering
- `<SimpleChapterHeader />` - Minimal chapter header (no numbering)
- `<FormattingPanel />` - UI for configuring formatting

### Utilities

- `formatToCSS(formatting)` - Generate CSS string
- `formatToDOCXStyles(formatting)` - Generate DOCX styles
- `formatToPDFConfig(formatting)` - Generate PDF config
- `generateFormattedHTML(content, formatting, title)` - Complete HTML document
- `validateFormatting(formatting)` - Check for issues

## Examples

See working examples in:
- [FormattingPanel.tsx](../src/components/Panels/FormattingPanel.tsx) - Live preview
- [ChapterHeader.tsx](../src/components/Document/ChapterHeader.tsx) - Component usage
- [exportHelpers.ts](../src/lib/formatting/exportHelpers.ts) - Export integration

## Testing

Run tests for numbering utilities:

```bash
npm test src/lib/formatting/__tests__/numbering.test.ts
```

## Roadmap

Future enhancements:

- [ ] Per-scene formatting overrides
- [ ] Style presets (Manuscript, Trade, Double-spaced)
- [ ] Font upload for custom typefaces
- [ ] Advanced typographic controls (widows/orphans, hyphenation)
- [ ] Multi-column layouts for newspapers/magazines
- [ ] Theme-based formatting (light/dark mode integration)

---

**Version**: 0.10.0
**Last Updated**: 2025-01-11
