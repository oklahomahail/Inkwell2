// pdfEngine.ts - HTML-to-PDF export engine with professional formatting

import { generateCSS, replaceTemplateVariables } from '../exportTemplates/presets';
import { ManuscriptDraft, StylePresetMeta, ExportRenderError } from '../exportTypes';
import { getMimeType } from '../exportUtils';

/**
 * Interface for export engines
 */
export interface ExportEngine {
  render(draft: ManuscriptDraft, style: StylePresetMeta): Promise<Blob>;
}

/**
 * Compiles manuscript data into HTML with proper styling
 */
function _compileManuscriptToHTML(draft: ManuscriptDraft, style: StylePresetMeta): string {
  const css = generateCSS(style);

  // Generate watermark HTML if specified
  const watermarkHTML = style.watermark
    ? `
    <div class="watermark" style="
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      opacity: ${style.watermark.opacity};
      z-index: -1;
      pointer-events: none;
    ">
      <!-- Watermark would be embedded as base64 SVG in production -->
      <div style="
        width: 200px;
        height: 200px;
        background: url('data:image/svg+xml;utf8,${encodeURIComponent(`
          <svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <g fill="${encodeURIComponent('#D4A537')}" fill-opacity="0.1">
              <path d="M100 20 C120 25, 140 35, 150 55 C155 65, 155 75, 150 85 L140 100 C135 110, 130 120, 125 130 L120 140 C115 150, 110 160, 105 170 L100 180 C95 170, 90 160, 85 150 L80 140 C75 130, 70 120, 65 110 L60 100 C55 85, 55 75, 60 65 C70 35, 80 25, 100 20 Z"/>
              <line x1="100" y1="20" x2="100" y2="180" stroke="${encodeURIComponent('#D4A537')}" stroke-width="2" stroke-opacity="0.15"/>
            </g>
          </svg>
        `)}') center/contain no-repeat;
      "></div>
    </div>
  `
    : '';

  // Generate front matter HTML
  const frontMatterHTML = draft.frontMatter
    ? `
    <div class="front-matter">
      ${
        draft.frontMatter.dedication
          ? `
        <div class="dedication">
          <h2>Dedication</h2>
          <div>${draft.frontMatter.dedication}</div>
        </div>
      `
          : ''
      }
      
      ${
        draft.frontMatter.acknowledgements
          ? `
        <div class="acknowledgements">
          <h2>Acknowledgements</h2>
          <div>${draft.frontMatter.acknowledgements}</div>
        </div>
      `
          : ''
      }
      
      ${
        draft.frontMatter.epigraph
          ? `
        <div class="epigraph">
          <div>${draft.frontMatter.epigraph}</div>
        </div>
      `
          : ''
      }
    </div>
  `
    : '';

  // Generate chapters HTML
  const chaptersHTML = draft.chapters
    .map((chapter) => {
      const scenesHTML = chapter.scenes
        .map((scene, sceneIndex) => {
          const isLastScene = sceneIndex === chapter.scenes.length - 1;
          const sceneBreakHTML =
            !isLastScene && style.sceneBreak
              ? `
        <div class="scene-break">${style.sceneBreak}</div>
      `
              : '';

          return `
        <div class="scene">
          ${scene}
        </div>
        ${sceneBreakHTML}
      `;
        })
        .join('');

      return `
      <div class="chapter" data-chapter="${chapter.number}">
        ${
          chapter.title
            ? `
          <h1 class="chapter-title">${chapter.title}</h1>
        `
            : ''
        }
        ${scenesHTML}
      </div>
    `;
    })
    .join('');

  // Generate back matter HTML
  const backMatterHTML = draft.backMatter
    ? `
    <div class="back-matter">
      ${
        draft.backMatter.aboutAuthor
          ? `
        <div class="about-author">
          <h2>About the Author</h2>
          <div>${draft.backMatter.aboutAuthor}</div>
        </div>
      `
          : ''
      }
      
      ${
        draft.backMatter.notes
          ? `
        <div class="notes">
          <h2>Notes</h2>
          <div>${draft.backMatter.notes}</div>
        </div>
      `
          : ''
      }
    </div>
  `
    : '';

  // Generate headers and footers HTML (for print CSS)
  const headerHTML = _generateRunningHeader(style, draft);
  const footerHTML = _generateRunningFooter(style, draft);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${draft.title}</title>
  <style>
${css}

/* Running headers and footers */
@page {
  @top-left { content: "${headerHTML.left}"; }
  @top-center { content: "${headerHTML.center}"; }
  @top-right { content: "${headerHTML.right}"; }
  @bottom-left { content: "${footerHTML.left}"; }
  @bottom-center { content: "${footerHTML.center}"; }
  @bottom-right { content: "${footerHTML.right}"; }
}

/* Page counter */
body {
  counter-reset: page;
}

@page {
  counter-increment: page;
}

/* Replace page tokens in headers/footers */
@page {
  @top-left { content: "${headerHTML.left.replace('{page}', '" counter(page) "')}"; }
  @top-center { content: "${headerHTML.center.replace('{page}', '" counter(page) "')}"; }
  @top-right { content: "${headerHTML.right.replace('{page}', '" counter(page) "')}"; }
  @bottom-left { content: "${footerHTML.left.replace('{page}', '" counter(page) "')}"; }
  @bottom-center { content: "${footerHTML.center.replace('{page}', '" counter(page) "')}"; }
  @bottom-right { content: "${footerHTML.right.replace('{page}', '" counter(page) "')}"; }
}
  </style>
</head>
<body>
  ${watermarkHTML}
  ${frontMatterHTML}
  
  <div class="manuscript-body">
    ${chaptersHTML}
  </div>
  
  ${backMatterHTML}
</body>
</html>`;
}

/**
 * Generates running header content
 */
function _generateRunningHeader(style: StylePresetMeta, draft: ManuscriptDraft) {
  const context = {
    title: draft.title,
    author: draft.author || '',
    chapterTitle: '', // Will be dynamic per page
    chapterNumber: 0, // Will be dynamic per page
    page: 0, // Will be replaced by CSS counter
    totalPages: draft.estimatedPages,
    date: new Date().toLocaleDateString(),
    projectName: draft.title,
  };

  return {
    left: replaceTemplateVariables(style.header?.left || '', context),
    center: replaceTemplateVariables(style.header?.center || '', context),
    right: replaceTemplateVariables(style.header?.right || '', context),
  };
}

/**
 * Generates running footer content
 */
function _generateRunningFooter(style: StylePresetMeta, draft: ManuscriptDraft) {
  const context = {
    title: draft.title,
    author: draft.author || '',
    chapterTitle: '', // Will be dynamic per page
    chapterNumber: 0, // Will be dynamic per page
    page: 0, // Will be replaced by CSS counter
    totalPages: draft.estimatedPages,
    date: new Date().toLocaleDateString(),
    projectName: draft.title,
  };

  return {
    left: replaceTemplateVariables(style.footer?.left || '', context),
    center: replaceTemplateVariables(style.footer?.center || '', context),
    right: replaceTemplateVariables(style.footer?.right || '', context),
  };
}

/**
 * Converts HTML to PDF using browser's print functionality
 * In a real implementation, you might use puppeteer or similar
 */
async function _htmlToPDF(html: string): Promise<Blob> {
  // Create a temporary iframe for PDF generation
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.top = '-9999px';
  iframe.style.left = '-9999px';
  iframe.style.width = '8.5in';
  iframe.style.height = '11in';

  document.body.appendChild(iframe);

  try {
    // Write HTML content to iframe
    const doc = iframe.contentDocument;
    if (!doc) {
      throw new Error('Could not access iframe document');
    }

    doc.open();
    doc.write(html);
    doc.close();

    // Wait for content to load
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // In a real implementation, you'd use puppeteer or similar for server-side PDF generation
    // For now, we'll create a mock PDF blob
    const mockPDFContent = _createMockPDFBlob(html);

    return mockPDFContent;
  } finally {
    // Clean up
    document.body.removeChild(iframe);
  }
}

/**
 * Creates a mock PDF blob for demonstration
 * In production, this would be replaced with actual PDF generation
 */
function _createMockPDFBlob(html: string): Blob {
  // This is a mock implementation - in production you'd generate a real PDF
  const pdfHeader = '%PDF-1.4\n';
  const mockContent = `Mock PDF content generated from manuscript.
Title: ${html.match(/<title>(.*?)<\/title>/)?.[1] || 'Untitled'}
Generated at: ${new Date().toISOString()}
Content length: ${html.length} characters

This is a mock PDF. In production, this would be generated using:
- Puppeteer (for server-side generation)
- Browser's print API (for client-side generation)
- pdf-lib (for programmatic PDF creation)

The HTML content would be properly rendered to PDF with:
- Correct page breaks
- Running headers and footers
- Watermarks
- Professional typography
`;

  const blob = new Blob([pdfHeader + mockContent], {
    type: getMimeType('PDF'),
  });

  return blob;
}

/**
 * PDF Export Engine implementation
 */
class PDFEngine implements ExportEngine {
  async render(draft: ManuscriptDraft, style: StylePresetMeta): Promise<Blob> {
    try {
      // Compile manuscript to HTML
      const html = _compileManuscriptToHTML(draft, style);

      // Convert to PDF
      const pdfBlob = await _htmlToPDF(html);

      // Validate the result
      if (!pdfBlob || pdfBlob.size === 0) {
        throw new Error('PDF generation failed - empty result');
      }

      return pdfBlob;
    } catch (error) {
      throw new ExportRenderError(`PDF generation failed: ${(error as any)?.message}`, 'PDF', {
        originalError: error,
      });
    }
  }
}

// Export the engine instance
export const pdfEngine = new PDFEngine();

// Functions already defined above

// For testing and development
export {
  _compileManuscriptToHTML as compileManuscriptToHTML,
  _createMockPDFBlob as createMockPDFBlob,
};
