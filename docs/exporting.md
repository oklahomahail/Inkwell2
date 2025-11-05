# Exporting Projects

**Version:** v0.9.1+
**Status:** Production-ready (PDF, DOCX, Markdown) | Beta (EPUB)

---

## Overview

Inkwell supports exporting your writing in multiple formats for distribution, archival, or further editing. Each format has different strengths and limitations.

---

## Supported Formats

### Format Comparison Matrix

| Format       | Status    | Use Case                        | Styling     | Metadata         | Images     |
| ------------ | --------- | ------------------------------- | ----------- | ---------------- | ---------- |
| **PDF**      | ✅ Stable | Print, distribution             | ✅ Basic    | ✅ Title, author | ❌ Not yet |
| **DOCX**     | ✅ Stable | Further editing (Word)          | ⚠️ RTF only | ✅ Title, author | ❌ Not yet |
| **Markdown** | ✅ Stable | Version control, plain text     | ❌ None     | ⚠️ Frontmatter   | ❌ N/A     |
| **EPUB**     | 🧪 Beta   | E-readers (Kindle, Apple Books) | ⚠️ Basic    | ✅ Full          | ❌ Not yet |
| **TXT**      | ✅ Stable | Plain text, no formatting       | ❌ None     | ❌ None          | ❌ N/A     |

**Legend:**

- ✅ Fully supported
- ⚠️ Partial support
- ❌ Not supported
- 🧪 Experimental (feature-flagged)

---

## Export Options

### 1. PDF Export

**How it works**: Opens print dialog with pre-formatted content. Save as PDF using browser's native print-to-PDF.

**Includes**:

- Title page with project name and description
- Chapter headers (styled as H1)
- Scene separators (configurable)
- Page numbers (browser-dependent)

**Options**:

- ✅ Include metadata (title page)
- ✅ Include synopsis
- ✅ Chapter separators
- ✅ Scene separators

**Styling**:

- Font: Times New Roman, 12pt
- Line height: 1.6
- Margins: 1 inch (standard)
- Paper: US Letter (8.5" × 11")

**Known Limitations**:

- No custom fonts
- No images/illustrations
- No table of contents (manual creation required)
- Page breaks not guaranteed at chapter boundaries

**Example Workflow**:

1. Click **"Export"** → **"PDF"**
2. Select export options
3. Browser print dialog opens
4. Choose **"Save as PDF"** destination
5. Adjust print settings if needed (margins, orientation)
6. Click **"Save"**

---

### 2. DOCX Export (RTF)

**How it works**: Generates RTF (Rich Text Format) file that can be opened in Microsoft Word, Google Docs, or LibreOffice.

**Includes**:

- Chapter headers (bold, larger font)
- Paragraph text with basic formatting (bold, italic)
- Horizontal rules for separators

**Options**:

- ✅ Include metadata
- ✅ Include synopsis
- ✅ Chapter separators
- ✅ Scene separators

**Styling**:

- Font: Times New Roman
- Headings: Bold, 18pt (H1), 14pt (H2)
- Body: 12pt

**Known Limitations**:

- RTF format, not true DOCX (no advanced Word features)
- No styles (Normal, Heading 1, etc.) - just direct formatting
- No table of contents
- No comments or track changes
- No images

**Post-Processing**:
After opening in Word, you can:

- Apply Word styles (Heading 1, Normal, etc.)
- Add page numbers and headers/footers
- Generate automatic table of contents
- Add images and illustrations

**Example Workflow**:

1. Click **"Export"** → **"DOCX"**
2. Select export options
3. File downloads as `.rtf`
4. Open in Microsoft Word or Google Docs
5. Apply additional formatting as needed

---

### 3. Markdown Export

**How it works**: Exports chapters as plain Markdown text with ATX-style headers.

**Includes**:

- Frontmatter (title, description, date) as YAML (optional)
- Chapter headers as `# Title`
- Scene headers as `## Title` (if not default)
- Markdown formatting preserved (bold, italic, links)

**Options**:

- ✅ Include metadata (YAML frontmatter)
- ✅ Include synopsis (as blockquote)
- ✅ Chapter separators (`---`)
- ✅ Scene separators (`* * *`)

**Known Limitations**:

- No styling (plain text)
- Formatting relies on Markdown renderer
- No page breaks

**Best For**:

- Version control (Git)
- Hugo/Jekyll static site generators
- Obsidian/Notion import
- Plain text editors (vim, Sublime)

**Example Output**:

```markdown
---
title: My Novel
author: Jane Doe
date: 2025-11-05
---

# Chapter 1: The Beginning

This is the first paragraph of my novel.

---

# Chapter 2: Rising Action

The story continues...
```

---

### 4. EPUB Export (Beta)

**Status**: 🧪 Feature-flagged (requires `VITE_ENABLE_EPUB_EXPORT=true`)

**How it works**: Generates minimal, valid EPUB 3.0 file with single-spine content.

**Includes**:

- Package metadata (title, author, language, UUID)
- Navigation document (table of contents from chapter titles)
- Single content document with all chapters
- Mandatory EPUB structure (mimetype, container.xml, package.opf)

**Options**:

- ✅ Include metadata (title, author, language)
- ❌ Include synopsis (not yet)
- ❌ Custom CSS styling (not yet)
- ❌ Cover image (not yet)

**Validation**:

- Passes `epubcheck --mode basic`
- Opens in Calibre, Apple Books, Google Play Books
- Compatible with Kindle (via KindleGen conversion)

**Known Limitations** (Phase 1):

- No custom CSS (basic reader defaults)
- No cover image
- Single-spine only (one HTML file for all chapters)
- No extended metadata (publisher, date, rights)
- No right-to-left language support
- No embedded fonts or images

**Future Enhancements** (Phase 3 - v1.0.0):

- Custom CSS themes
- Cover image upload
- Multi-file spine (one file per chapter)
- Extended metadata (publisher, series, ISBN)
- Accessibility features (ARIA, landmarks)

**Example Workflow**:

1. Ensure flag enabled: `VITE_ENABLE_EPUB_EXPORT=true` in `.env`
2. Click **"Export"** → **"EPUB"**
3. Select export options (title, author, language)
4. File downloads as `.epub`
5. Test in Calibre or e-reader app

**Troubleshooting EPUB**:
See [EPUB Foundation Checklist](../.implementations/EPUB_FOUNDATION_CHECKLIST.md#troubleshooting)

---

### 5. Plain Text (TXT)

**How it works**: Converts Markdown to plain text by stripping all formatting.

**Includes**:

- Chapter titles (no special formatting)
- Body text (bold/italic removed)
- Horizontal rules as `* * *`

**Options**:

- ✅ Include metadata (plain text header)
- ✅ Include synopsis
- ✅ Chapter separators
- ✅ Scene separators

**Known Limitations**:

- No formatting whatsoever
- Links stripped (only link text remains)
- No structure beyond line breaks

**Best For**:

- Plain text editors
- Maximum compatibility
- Word count tools (Scrivener import)
- ASCII-only environments

---

## Export Telemetry

When you export a project, Inkwell emits anonymous telemetry events:

**Event**: `export.run`

**Payload**:

```json
{
  "event": "export.run",
  "format": "PDF", // PDF, DOCX, EPUB, MARKDOWN, TXT
  "chapters": "all", // all or subset
  "sample": 1
}
```

**Privacy**: No project content, titles, or identifiable data is collected. See [Privacy & Telemetry](./privacy.md) for details.

**Opt-out**: Set `inkwell_telemetry_disabled=true` in localStorage.

---

## Export History

Inkwell tracks export history locally (not synced):

**Stored Data**:

- Timestamp
- Export type (PDF, DOCX, etc.)
- Chapters included (IDs and positions)
- Total word count
- Duration (performance metric)
- Success/failure status

**Access**: Settings → Export History (coming in v0.10.0)

**Privacy**: Export history is local-only, never transmitted.

---

## Feature Flags

### EPUB Export Flag

```bash
# .env.local
VITE_ENABLE_EPUB_EXPORT=true
```

- **Default**: `true` (enabled by default in v0.9.1+)
- **Effect**: Shows/hides EPUB option in export dialog
- **Validation**: If disabled, calling EPUB export throws error

To disable EPUB export:

```bash
VITE_ENABLE_EPUB_EXPORT=false
```

Restart dev server after changing `.env` files.

---

## Troubleshooting

### PDF Export Issues

**Problem**: Print dialog not opening
**Fix**: Check popup blocker settings, allow popups for Inkwell domain

**Problem**: Missing chapters in PDF
**Fix**: Ensure all chapters are selected in export options

**Problem**: Wrong font/styling
**Fix**: Currently fixed to Times New Roman. Custom styling coming in v1.0.0

---

### DOCX Export Issues

**Problem**: Won't open in Word
**Fix**: File is RTF format (rename `.rtf` → `.docx` won't help). Open as RTF in Word, then Save As DOCX.

**Problem**: No table of contents
**Fix**: RTF doesn't support TOC. Open in Word, apply Heading styles, then Insert → Table of Contents

**Problem**: Lost formatting
**Fix**: Check if Markdown had special characters. Try Markdown export first to verify content.

---

### EPUB Export Issues

**Problem**: "EPUB export is disabled"
**Fix**: Set `VITE_ENABLE_EPUB_EXPORT=true` in `.env.local` and restart dev server

**Problem**: EPUB won't open in reader
**Fix**: Run `epubcheck your-file.epub --mode basic` to identify errors. See [EPUB Troubleshooting](../.implementations/EPUB_FOUNDATION_CHECKLIST.md#troubleshooting)

**Problem**: Chapter links don't work
**Fix**: Verify chapter titles are non-empty and don't contain special XML characters

---

### Markdown Export Issues

**Problem**: Missing frontmatter
**Fix**: Enable "Include metadata" option in export dialog

**Problem**: Broken Markdown syntax
**Fix**: Check for unescaped special characters in content (e.g., `[`, `]`, `#` at line start)

---

## API Reference

For developers integrating with Inkwell's export system:

### Export Service

```typescript
import { exportService } from '@/services/exportService';

// Export PDF
await exportService.exportPDFWithChapters(projectId, chapters, options);

// Export DOCX (RTF)
await exportService.exportDOCXWithChapters(projectId, chapters, options);

// Export Markdown
await exportService.exportMarkdownWithChapters(projectId, chapters, options);

// Export EPUB
await exportService.exportEPUBWithChapters(projectId, chapters, options);
```

### Export Options

```typescript
interface ExportOptions {
  format: string;
  includeMetadata?: boolean; // Title page
  includeSynopsis?: boolean; // Synopsis section
  includeCharacterNotes?: boolean; // Character profiles (future)
  chapterSeparator?: string; // Default: '\n\n---\n\n'
  sceneSeparator?: string; // Default: '\n\n* * *\n\n'
  customTitle?: string; // Override project title
}
```

---

## Related Documentation

- [EPUB Foundation Checklist](../.implementations/EPUB_FOUNDATION_CHECKLIST.md) - Implementation details
- [Privacy & Telemetry](./privacy.md) - Export telemetry events
- [Backup System](./backup.md) - Export as backup vs. distribution

---

## Future Roadmap

### v0.10.0

- [ ] Cover image upload for EPUB
- [ ] Custom CSS themes for EPUB
- [ ] Export history UI

### v1.0.0

- [ ] Multi-file EPUB spine (one file per chapter)
- [ ] True DOCX export (via docx.js)
- [ ] Custom PDF styling options
- [ ] Batch export (multiple formats at once)
- [ ] Image embedding support

---

**Last updated**: November 2025
**Tested with**: Chrome 119+, Firefox 120+, Safari 17+
**EPUB validated**: epubcheck 5.0.1
