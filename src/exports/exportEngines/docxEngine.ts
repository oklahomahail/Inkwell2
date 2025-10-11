import { ManuscriptDraft, StylePresetMeta } from '../exportTypes';

import { BaseExportEngine, EngineCapabilities } from './types-internal';

/**
 * DOCX Export Engine
 * Creates Microsoft Word-compatible documents
 *
 * Current implementation generates RTF format which is compatible with Word
 * TODO: Upgrade to true DOCX generation using a library like docx.js
 */
export class DOCXEngine extends BaseExportEngine {
  name = 'DOCX Engine';

  capabilities: EngineCapabilities = {
    name: 'Microsoft Word Document',
    formats: ['docx'],
    features: {
      headers: true,
      footers: true,
      pageBreaks: true,
      watermarks: false, // Not implemented in RTF fallback
      customFonts: true,
      tableOfContents: false, // TODO: Implement
    },
  };

  async render(draft: ManuscriptDraft, style: StylePresetMeta): Promise<Blob> {
    this.reportProgress(undefined, 'rendering', 0, 'Starting DOCX generation...');

    try {
      // Generate RTF content (Word-compatible)
      const rtfContent = this.generateRTF(draft, style);

      this.reportProgress(undefined, 'rendering', 90, 'Finalizing document...');

      // Create blob with DOCX MIME type (RTF is compatible)
      const blob = new Blob([rtfContent], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });

      this.reportProgress(undefined, 'finalizing', 100, 'DOCX export complete');
      return blob;
    } catch (error) {
      console.error('DOCX export failed:', error);
      throw new Error(
        `DOCX generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  private generateRTF(draft: ManuscriptDraft, style: StylePresetMeta): string {
    const rtfHeader = this.createRTFHeader(style);
    const rtfBody = this.createRTFBody(draft, style);
    const rtfFooter = '}'; // Close RTF document

    return rtfHeader + rtfBody + rtfFooter;
  }

  private createRTFHeader(style: StylePresetMeta): string {
    // RTF header with font table and style definitions
    const fontSize = Math.round(style.fontSizePt * 2); // RTF uses half-points

    return `{\\rtf1\\ansi\\deff0 
{\\fonttbl
{\\f0\\fnil\\fcharset0 ${this.mapFontToRTF(style.baseFont)};}
}
{\\colortbl ;\\red0\\green0\\blue0;}
\\paperw12240\\paperh15840\\margl${Math.round(style.marginsIn.left * 1440)}\\margr${Math.round(style.marginsIn.right * 1440)}\\margt${Math.round(style.marginsIn.top * 1440)}\\margb${Math.round(style.marginsIn.bottom * 1440)}
\\f0\\fs${fontSize}\\sl${Math.round(style.lineSpacing * 240)}\\slmult1
`;
  }

  private createRTFBody(draft: ManuscriptDraft, style: StylePresetMeta): string {
    let rtfBody = '';

    // Title page
    if (draft.title) {
      rtfBody += `\\qc\\b\\fs${Math.round(style.fontSizePt * 3)} ${this.escapeRTF(draft.title)}\\b0\\par\\par`;
    }

    if (draft.author) {
      rtfBody += `\\qc\\fs${Math.round(style.fontSizePt * 2.5)} by ${this.escapeRTF(draft.author)}\\par\\page`;
    }

    // Front matter
    if (draft.frontMatter?.dedication) {
      rtfBody += `\\qc\\i ${this.escapeRTF(draft.frontMatter.dedication)}\\i0\\par\\page`;
    }

    // Chapters
    for (let i = 0; i < draft.chapters.length; i++) {
      const chapter = draft.chapters[i];
      if (!chapter) continue;

      if (style.chapterPageBreak && i > 0) {
        rtfBody += '\\page';
      }

      // Chapter title
      const chapterTitle = chapter.title || `Chapter ${chapter.number ?? i + 1}`;
      rtfBody += `\\qc\\b\\fs${Math.round(style.fontSizePt * 2.5)} ${this.escapeRTF(chapterTitle)}\\b0\\par\\par`;

      // Chapter scenes
      const scenes = Array.isArray(chapter.scenes) ? chapter.scenes : [];
      for (let j = 0; j < scenes.length; j++) {
        const scene = scenes[j];

        if (j > 0) {
          // Scene break
          rtfBody += `\\qc ${this.escapeRTF(style.sceneBreak)}\\par\\par`;
        }

        // Scene content
        const content = typeof scene === 'string' ? scene : '';
        rtfBody += `\\ql ${this.escapeRTF(content)}\\par\\par`;
      }
    }

    // Back matter
    if (draft.backMatter?.aboutAuthor) {
      rtfBody += `\\page\\qc\\b About the Author\\b0\\par\\par\\ql ${this.escapeRTF(draft.backMatter.aboutAuthor)}\\par`;
    }

    return rtfBody;
  }

  private mapFontToRTF(font: StylePresetMeta['baseFont']): string {
    const fontMap: Record<StylePresetMeta['baseFont'], string> = {
      'Times New Roman': 'Times New Roman',
      Georgia: 'Georgia',
      Garamond: 'Garamond',
      Inter: 'Arial', // Fallback to Arial for Inter
    };

    return fontMap[font];
  }

  private escapeRTF(text: string): string {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/\{/g, '\\{')
      .replace(/\}/g, '\\}')
      .replace(/\n/g, '\\par ')
      .replace(/\r/g, '');
  }
}

// Export singleton instance
export const docxEngine = new DOCXEngine();
