# EPUB 3.0 Foundation — Implementation Checklist

**Feature:** Minimal, valid EPUB 3.0 export with single-spine content
**Branch:** `feat/v0.9.1-onboarding`
**Status:** ✅ Ready for QA
**Date:** 2025-11-05

---

## 📋 Implementation Complete

### Core Files Created

- [x] `src/services/export/exportService.epub.ts` (289 lines)
  - exportEpub() - Main export function
  - buildOpf() - Package document generator
  - buildNavXhtml() - Navigation document generator
  - buildContentXhtml() - Content document generator
  - downloadEpub() - Blob download helper
  - sanitizeFilename() - Filename sanitizer

- [x] `src/services/__tests__/exportService.epub.test.ts` (264 lines)
  - 20+ unit tests for metadata integrity
  - Tests for OPF, nav, content generation
  - Input validation tests
  - Feature flag tests
  - Language handling tests

### Core Files Modified

- [x] `src/services/exportService.ts`
  - Added `ExportFormat.EPUB` enum value
  - Added `exportEPUBWithChapters()` method
  - Updated switch statement with EPUB case

- [x] `src/services/telemetry.ts`
  - Added `export.epub.success` event
  - Added `export.epub.failure` event

- [x] `.env.example`
  - Added `VITE_ENABLE_EPUB_EXPORT=true` flag
  - Documented EPUB telemetry events

---

## ✅ Feature Requirements (EPUB 3.0 Spec)

### Mandatory Files

- [x] **mimetype** - Literal string `application/epub+zip`
  - First entry in ZIP
  - Uncompressed (STORE method)
  - No extra fields or padding

- [x] **META-INF/container.xml** - Container document
  - Points to `OEBPS/package.opf`
  - Valid XML namespace

- [x] **OEBPS/package.opf** - Package document
  - Metadata: title, language, identifier (UUID)
  - Optional: author (dc:creator)
  - Manifest: nav.xhtml, content.xhtml
  - Spine: single itemref to content
  - `properties="nav"` on nav.xhtml item

- [x] **OEBPS/nav.xhtml** - Navigation document
  - EPUB 3 `epub:type="toc"` attribute
  - Table of contents with anchors to content.xhtml
  - Valid XHTML 5 with proper namespaces

- [x] **OEBPS/content.xhtml** - Content document
  - Single-spine XHTML with all chapters
  - Chapters wrapped in `<section id="ch-N">` tags
  - IDs match nav.xhtml anchors

### Validation

- [x] XML special characters escaped in metadata
- [x] Chapter titles escaped in nav and content
- [x] Body HTML preserved (not escaped)
- [x] IDs match between nav and content documents
- [x] Language code normalized to lowercase BCP 47

---

## 🧪 Testing (Unit Tests)

### buildOpf() Tests

- [x] Includes title, language, author (when provided)
- [x] Omits author when not provided
- [x] Escapes XML special characters
- [x] Includes manifest items (nav, content)
- [x] Includes spine with content itemref
- [x] Sets `properties="nav"` on nav item

### buildNavXhtml() Tests

- [x] Generates navigation with correct anchors
- [x] Escapes chapter titles
- [x] Sets correct language attribute
- [x] Includes XHTML and EPUB namespaces
- [x] Uses `epub:type="toc"` attribute

### buildContentXhtml() Tests

- [x] Generates sections with matching IDs
- [x] Includes chapter body HTML
- [x] Sets correct language attribute
- [x] Escapes titles but preserves body HTML

### Anchor Matching Tests

- [x] nav anchors match content section IDs
- [x] All chapters have corresponding links

### exportEpub() Tests

- [x] Generates valid EPUB blob
- [x] Throws error when feature flag disabled
- [x] Throws error when title missing
- [x] Throws error when chapters empty
- [x] Throws error when chapter title missing
- [x] Defaults language to "en"
- [x] Normalizes language to lowercase

### Utility Tests

- [x] sanitizeFilename converts to lowercase
- [x] sanitizeFilename replaces spaces with underscores
- [x] sanitizeFilename removes special characters
- [x] sanitizeFilename preserves hyphens and underscores

---

## ⚙️ Feature Flag

- [x] `VITE_ENABLE_EPUB_EXPORT` respected in code
- [x] Default value: `true` (enabled by default)
- [x] Documented in `.env.example`
- [x] Early-return with error when disabled
- [x] UI should hide EPUB option when flag is false (TODO: UI integration)

---

## 📊 Telemetry (PII-Free)

- [x] `export.epub.success` emitted on successful export
- [x] `export.epub.failure` emitted on failed export
- [x] Payload: `{ sample: 1 }` only (no content or titles)
- [x] Respects `isTelemetryEnabled()` opt-out
- [x] Events documented in `.env.example`

---

## 🔍 Code Quality

### TypeScript

- [x] 0 TypeScript errors
- [x] All functions have proper type signatures
- [x] Input/output types well-defined
- [x] No `any` types except where necessary

### ESLint

- [x] 0 new ESLint warnings
- [x] Code follows project conventions
- [x] Proper imports and exports

### Documentation

- [x] JSDoc comments on all public functions
- [x] Clear parameter descriptions
- [x] Usage examples in comments

---

## 📦 ZIP Structure Validation

```
<zip root>
├─ mimetype                         (uncompressed; must be first)
├─ META-INF/
│  └─ container.xml
└─ OEBPS/
   ├─ package.opf
   ├─ nav.xhtml
   └─ content.xhtml
```

- [x] mimetype is first entry
- [x] mimetype uses STORE compression (uncompressed)
- [x] All other files use default compression (DEFLATE)
- [x] Correct directory structure (META-INF, OEBPS)
- [x] All required files present

---

## 🎯 Acceptance Criteria

### Functional Requirements

- [x] Single HTML spine (one content.xhtml with all chapters)
- [x] Valid package.opf (title, author, language)
- [x] Navigation (nav.xhtml) built from chapter titles
- [x] Mandatory files: mimetype, META-INF/container.xml
- [x] Feature-flagged via VITE_ENABLE_EPUB_EXPORT
- [x] Unit tests focused on metadata integrity

### EPUB 3.0 Compliance

- [x] Valid XHTML 5 documents
- [x] Correct XML namespaces
- [x] EPUB 3.0 navigation document format
- [x] Unique identifier (UUID) in package
- [x] Language code in BCP 47 format
- [x] Media types correct in manifest

### Integration

- [x] Integrates with existing exportService
- [x] Uses Chapter[] data model
- [x] Telemetry with export history logging
- [x] Markdown to HTML conversion
- [x] Blob download with correct filename

---

## 🚀 Manual QA Checklist

### Basic Export

- [ ] EPUB file downloads with correct filename
- [ ] File extension is .epub
- [ ] File size > 0 bytes

### EPUB Validation

- [ ] Open EPUB in calibre (should open without errors)
- [ ] Open EPUB in Apple Books (should open without errors)
- [ ] Open EPUB in Google Play Books (should open without errors)
- [ ] Run `epubcheck --mode basic` (should pass)
- [ ] Unzip EPUB and verify file structure

### Content Verification

- [ ] All chapters appear in table of contents
- [ ] Chapter links navigate to correct sections
- [ ] Chapter titles display correctly
- [ ] Chapter content displays correctly
- [ ] Book title appears in reader
- [ ] Author name appears (if provided)
- [ ] Language is set correctly

### Feature Flag

- [ ] EPUB export works when flag is true
- [ ] EPUB export throws error when flag is false
- [ ] UI hides EPUB option when flag is false (TODO)

### Telemetry

- [ ] `export.epub.success` event fires on successful export
- [ ] `export.epub.failure` event fires on failed export
- [ ] Events respect telemetry opt-out
- [ ] No PII in telemetry payload

### Edge Cases

- [ ] Export with no author (omits dc:creator)
- [ ] Export with special characters in title (XML-escaped)
- [ ] Export with special characters in chapter titles (XML-escaped)
- [ ] Export with HTML in chapter content (preserved)
- [ ] Export with single chapter
- [ ] Export with many chapters (10+)
- [ ] Export with empty chapter content

---

## 🔬 epubcheck Validation

### Basic Mode Validation

```bash
# Install epubcheck (if not already installed)
npm install -g epubcheck

# Run basic validation on sample export
epubcheck path/to/sample.epub --mode basic

# Expected output: No errors or warnings
```

### Validation Checklist

- [ ] epubcheck basic mode passes with 0 errors
- [ ] No warnings about mimetype
- [ ] No warnings about container.xml
- [ ] No warnings about package.opf
- [ ] No warnings about nav.xhtml
- [ ] No warnings about content.xhtml
- [ ] No warnings about manifest items
- [ ] No warnings about spine

---

## 📝 Known Limitations (Phase 1)

### Not Included (Phase 3 Future Work)

- **Stylesheet** - No CSS styling (basic reader defaults)
- **Cover Image** - No cover.jpg or manifest cover-image property
- **Multi-File Spine** - Single content.xhtml (not per-chapter files)
- **Extended Metadata** - No publisher, date, rights, etc.
- **Accessibility** - No ARIA roles or landmarks
- **RTL Support** - No right-to-left language support
- **Fonts** - No custom font embedding
- **Images** - No image support (TODO: future)

### Acceptable Limitations

- Author field is optional (dc:creator omitted if empty)
- Language defaults to "en" (not yet configurable)
- No server-side EPUB processing
- Requires JSZip library (already installed)

---

## 🐛 Troubleshooting

### Common Issues

**EPUB won't open in reader**

- Check mimetype is first entry (uncompressed)
- Verify container.xml points to correct OPF path
- Run epubcheck to identify specific errors

**Chapter links don't work**

- Verify nav anchors match content IDs
- Check for XML escaping errors
- Ensure IDs are unique

**Metadata missing**

- Check OPF includes all required dc: elements
- Verify XML namespaces are correct
- Ensure title and language are non-empty

**Feature flag not working**

- Check .env file has VITE_ENABLE_EPUB_EXPORT=true
- Restart dev server after changing .env
- Verify import.meta.env.VITE_ENABLE_EPUB_EXPORT is accessible

---

## 🔄 Integration Points

### Export Service Integration

- `ExportFormat.EPUB` enum value added
- `exportEPUBWithChapters()` method follows existing pattern
- Uses `exportWithTelemetry()` wrapper
- Converts markdown to HTML via `markdownToHTML()`
- Integrates with export history logging

### Data Flow

1. User selects EPUB export in UI
2. UI calls `exportService.exportEPUBWithChapters()`
3. Service loads project and chapters
4. Chapters sorted by order
5. Markdown converted to HTML
6. EPUB documents generated
7. ZIP archive created with proper structure
8. Blob downloaded with sanitized filename
9. Telemetry events emitted
10. Export logged to history

---

## 📚 References

- **EPUB 3.0 Spec**: https://www.w3.org/publishing/epub3/epub-spec.html
- **EPUB Navigation**: https://www.w3.org/publishing/epub3/epub-packages.html#sec-package-nav
- **epubcheck**: https://github.com/w3c/epubcheck
- **JSZip**: https://stuk.github.io/jszip/

---

## ✅ Pre-Merge Checklist

- [x] All TypeScript compilation passes
- [x] All ESLint checks pass
- [x] All unit tests pass (20+ new tests)
- [x] Feature flag documented
- [x] Telemetry events added
- [x] exportService integration complete
- [ ] Manual QA on sample EPUB
- [ ] epubcheck validation passes
- [ ] Commit message follows convention

---

**Prepared by:** Claude Code
**Review Status:** Ready for QA and epubcheck validation
**Deployment Target:** v0.9.1 Beta (Week 2)
**Estimated QA Time:** 30-45 minutes
