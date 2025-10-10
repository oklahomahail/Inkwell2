import { ManuscriptDraft, StylePresetMeta } from '../exportTypes';

import { BaseExportEngine, EngineCapabilities } from './types-internal';

/**
 * EPUB Export Engine
 * Creates EPUB format e-books
 *
 * Current implementation generates a simplified XHTML bundle
 * TODO: Generate proper EPUB zip with metadata, CSS, and structure
 */
export class EPUBEngine extends BaseExportEngine {
  name = 'EPUB Engine';

  capabilities: EngineCapabilities = {
    name: 'EPUB E-book',
    formats: ['epub'],
    features: {
      headers: false, // Not standard in EPUB
      footers: false, // Not standard in EPUB
      pageBreaks: true,
      watermarks: false,
      customFonts: true,
      tableOfContents: true,
    },
  };

  async render(draft: ManuscriptDraft, style: StylePresetMeta): Promise<Blob> {
    this.reportProgress(undefined, 'rendering', 0, 'Starting EPUB generation...');

    try {
      // Generate XHTML content (simplified EPUB)
      const xhtmlContent = this.generateXHTML(draft, style);

      this.reportProgress(undefined, 'rendering', 90, 'Finalizing e-book...');

      // Create blob with EPUB MIME type
      const blob = new Blob([xhtmlContent], {
        type: 'application/epub+zip',
      });

      this.reportProgress(undefined, 'finalizing', 100, 'EPUB export complete');
      return blob;
    } catch (error) {
      console.error('EPUB export failed:', error);
      throw new Error(
        `EPUB generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  private generateXHTML(draft: ManuscriptDraft, style: StylePresetMeta): string {
    const css = this.generateCSS(style);
    const bodyContent = this.generateBody(draft, style);

    return `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>${this.escapeXHTML(draft.title)}</title>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <style type="text/css">
    ${css}
  </style>
</head>
<body>
  ${bodyContent}
</body>
</html>`;
  }

  private generateCSS(style: StylePresetMeta): string {
    const fontFamily = this.mapFontToCSS(style.baseFont);

    return `
      body {
        font-family: ${fontFamily};
        font-size: ${style.fontSizePt}pt;
        line-height: ${style.lineSpacing};
        margin: 0;
        padding: 20px;
        text-align: justify;
      }
      
      .title-page {
        text-align: center;
        margin-bottom: 3em;
        page-break-after: always;
      }
      
      .title {
        font-size: 2em;
        font-weight: bold;
        margin-bottom: 1em;
      }
      
      .author {
        font-size: 1.2em;
        margin-bottom: 2em;
      }
      
      .chapter {
        page-break-before: always;
        margin-bottom: 2em;
      }
      
      .chapter-title {
        font-size: 1.5em;
        font-weight: bold;
        text-align: center;
        margin-bottom: 2em;
      }
      
      .scene-break {
        text-align: center;
        margin: 2em 0;
        font-size: 1.2em;
      }
      
      .scene {
        margin-bottom: 1.5em;
      }
      
      .front-matter, .back-matter {
        page-break-before: always;
        margin-bottom: 2em;
      }
      
      .dedication {
        text-align: center;
        font-style: italic;
        margin: 3em 0;
      }
      
      p {
        margin: 0 0 1em 0;
        text-indent: 1.5em;
      }
      
      p:first-child {
        text-indent: 0;
      }
    `;
  }

  private generateBody(draft: ManuscriptDraft, style: StylePresetMeta): string {
    let content = '';

    // Title page
    content += '<div class="title-page">';
    if (draft.title) {
      content += `<h1 class="title">${this.escapeXHTML(draft.title)}</h1>`;
    }
    if (draft.author) {
      content += `<div class="author">by ${this.escapeXHTML(draft.author)}</div>`;
    }
    content += '</div>';

    // Front matter
    if (draft.frontMatter?.dedication) {
      content += `<div class="front-matter">
        <div class="dedication">${this.escapeXHTML(draft.frontMatter.dedication)}</div>
      </div>`;
    }

    if (draft.frontMatter?.epigraph) {
      content += `<div class="front-matter">
        <div class="dedication">${this.escapeXHTML(draft.frontMatter.epigraph)}</div>
      </div>`;
    }

    // Chapters
    for (const chapter of draft.chapters) {
      content += '<div class="chapter">';

      const chapterTitle = chapter.title || `Chapter ${chapter.number}`;
      content += `<h2 class="chapter-title">${this.escapeXHTML(chapterTitle)}</h2>`;

      // Scenes within chapter
      for (let i = 0; i < chapter.scenes.length; i++) {
        const scene = chapter.scenes[i];

        if (i > 0) {
          content += `<div class="scene-break">${this.escapeXHTML(style.sceneBreak)}</div>`;
        }

        content += `<div class="scene">`;

        // Split scene into paragraphs
        const paragraphs = scene.split('\n').filter((p) => p.trim().length > 0);
        for (const paragraph of paragraphs) {
          content += `<p>${this.escapeXHTML(paragraph.trim())}</p>`;
        }

        content += '</div>';
      }

      content += '</div>';
    }

    // Back matter
    if (draft.backMatter?.aboutAuthor) {
      content += `<div class="back-matter">
        <h2>About the Author</h2>
        <p>${this.escapeXHTML(draft.backMatter.aboutAuthor)}</p>
      </div>`;
    }

    if (draft.backMatter?.acknowledgements) {
      content += `<div class="back-matter">
        <h2>Acknowledgements</h2>
        <p>${this.escapeXHTML(draft.backMatter.acknowledgements)}</p>
      </div>`;
    }

    if (draft.backMatter?.notes) {
      content += `<div class="back-matter">
        <h2>Notes</h2>
        <p>${this.escapeXHTML(draft.backMatter.notes)}</p>
      </div>`;
    }

    return content;
  }

  private mapFontToCSS(font: StylePresetMeta['baseFont']): string {
    const fontMap: Record<StylePresetMeta['baseFont'], string> = {
      'Times New Roman': '"Times New Roman", Times, serif',
      Georgia: 'Georgia, Times, serif',
      Garamond: 'Garamond, Times, serif',
      Inter: 'Inter, Arial, sans-serif',
    };

    return fontMap[font];
  }

  private escapeXHTML(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }
}

// Export singleton instance
export const epubEngine = new EPUBEngine();
