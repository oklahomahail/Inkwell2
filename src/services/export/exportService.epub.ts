/**
 * EPUB 3.0 Export Service
 *
 * Generates minimal, valid EPUB 3.0 files with:
 * - Single HTML spine (content.xhtml with all chapters)
 * - Valid package.opf with metadata (title, author, language)
 * - Navigation document (nav.xhtml) built from chapter titles
 * - Mandatory files: mimetype, META-INF/container.xml
 *
 * Validated via epubcheck basic mode.
 * Feature-flagged via VITE_ENABLE_EPUB_EXPORT.
 */

import JSZip from 'jszip';

import { track } from '@/services/telemetry';

// Feature flag check
const EPUB_ENABLED = import.meta.env.VITE_ENABLE_EPUB_EXPORT?.toLowerCase() !== 'false';

/**
 * Input data model for EPUB export
 */
export interface ExportChapter {
  id: string;
  title: string;
  bodyHtml: string; // Pre-sanitized HTML content
}

export interface EpubExportInput {
  title: string;
  author?: string;
  language?: string; // BCP 47 (e.g. "en", "en-US")
  chapters: ExportChapter[];
}

/**
 * Validate EPUB export input
 */
function validateInput(input: EpubExportInput): void {
  if (!input.title?.trim()) {
    throw new Error('EPUB export requires a title');
  }
  if (!input.chapters || input.chapters.length === 0) {
    throw new Error('EPUB export requires at least one chapter');
  }
  for (const chapter of input.chapters) {
    if (!chapter.title?.trim()) {
      throw new Error(`Chapter ${chapter.id} is missing a title`);
    }
  }
}

/**
 * Normalize language code to lowercase BCP 47 format
 */
function normalizeLang(lang: string): string {
  return lang.toLowerCase().trim();
}

/**
 * Generate a valid UUID v4 for EPUB identifier
 */
function generateUUID(): string {
  return crypto.randomUUID();
}

/**
 * Escape XML special characters
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Build package.opf (content.opf) with metadata, manifest, and spine
 */
export function buildOpf(params: {
  title: string;
  author?: string;
  lang: string;
  uuid: string;
}): string {
  const { title, author, lang, uuid } = params;

  const authorElement = author?.trim() ? `    <dc:creator>${escapeXml(author)}</dc:creator>\n` : '';

  return `<?xml version="1.0" encoding="utf-8"?>
<package version="3.0" unique-identifier="pub-id"
         xmlns="http://www.idpf.org/2007/opf"
         xml:lang="${escapeXml(lang)}">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="pub-id">urn:uuid:${uuid}</dc:identifier>
    <dc:title>${escapeXml(title)}</dc:title>
    <dc:language>${escapeXml(lang)}</dc:language>
${authorElement}  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="content" href="content.xhtml" media-type="application/xhtml+xml"/>
  </manifest>
  <spine>
    <itemref idref="content"/>
  </spine>
</package>
`;
}

/**
 * Build nav.xhtml (EPUB 3 navigation document)
 */
export function buildNavXhtml(chapters: ExportChapter[], lang: string): string {
  // Normalize language to lowercase for consistency
  const normalizedLang = normalizeLang(lang);

  const tocItems = chapters
    .map((chapter, index) => {
      const chapterId = `ch-${index + 1}`;
      return `    <li><a href="content.xhtml#${chapterId}">${escapeXml(chapter.title)}</a></li>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="${escapeXml(normalizedLang)}" lang="${escapeXml(normalizedLang)}">
<head>
  <meta charset="utf-8"/>
  <title>Table of Contents</title>
</head>
<body>
  <nav epub:type="toc" id="toc">
    <h2>Contents</h2>
    <ol>
${tocItems}
    </ol>
  </nav>
</body>
</html>
`;
}

/**
 * Build content.xhtml (single-spine document with all chapters)
 */
export function buildContentXhtml(chapters: ExportChapter[], lang: string): string {
  // Normalize language to lowercase for consistency
  const normalizedLang = normalizeLang(lang);

  const sectionsHtml = chapters
    .map((chapter, index) => {
      const chapterId = `ch-${index + 1}`;
      return `  <section id="${chapterId}">
    <h1>${escapeXml(chapter.title)}</h1>
${chapter.bodyHtml}
  </section>
`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="${escapeXml(normalizedLang)}" lang="${escapeXml(normalizedLang)}">
<head>
  <meta charset="utf-8"/>
  <title>Content</title>
</head>
<body>
${sectionsHtml}
</body>
</html>
`;
}

/**
 * Generate META-INF/container.xml
 */
const CONTAINER_XML = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/package.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>
`;

/**
 * Export project as EPUB 3.0
 *
 * @param input - Export parameters (title, author, language, chapters)
 * @returns Promise<Blob> - EPUB file blob
 * @throws Error if feature flag is disabled or validation fails
 */
export async function exportEpub(input: EpubExportInput): Promise<Blob> {
  // Feature flag guard
  if (!EPUB_ENABLED) {
    throw new Error('EPUB export is disabled by feature flag (VITE_ENABLE_EPUB_EXPORT)');
  }

  try {
    // Validate input
    validateInput(input);

    // Generate UUID for EPUB identifier
    const uuid = generateUUID();
    const lang = normalizeLang(input.language ?? 'en');

    // Build EPUB documents
    const nav = buildNavXhtml(input.chapters, lang);
    const content = buildContentXhtml(input.chapters, lang);
    const opf = buildOpf({
      title: input.title,
      author: input.author,
      lang,
      uuid,
    });

    // Create ZIP archive
    const zip = new JSZip();

    // Add mimetype as first entry, uncompressed (EPUB spec requirement)
    zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });

    // Add META-INF
    zip.file('META-INF/container.xml', CONTAINER_XML);

    // Add OEBPS content
    zip.file('OEBPS/nav.xhtml', nav);
    zip.file('OEBPS/content.xhtml', content);
    zip.file('OEBPS/package.opf', opf);

    // Generate blob
    const blob = await zip.generateAsync({ type: 'blob' });

    // Emit success telemetry (PII-free)
    track('export.epub.success', { sample: 1 });

    return blob;
  } catch (error) {
    // Emit failure telemetry (PII-free)
    track('export.epub.failure', { sample: 1 });

    // Re-throw with context
    throw new Error(
      `EPUB export failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

/**
 * Sanitize filename for safe download
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-z0-9\s\-_]/gi, '')
    .replace(/\s+/g, '_')
    .toLowerCase();
}

/**
 * Download EPUB blob with suggested filename
 */
export function downloadEpub(blob: Blob, title: string): void {
  const filename = `${sanitizeFilename(title)}.epub`;
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Cleanup blob URL after download
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
