import { ManuscriptDraft, StylePresetMeta } from '../exportTypes';

export interface ExportEngine {
  render(draft: ManuscriptDraft, style: StylePresetMeta): Promise<Blob>;
}

export interface RenderContext {
  draft: ManuscriptDraft;
  style: StylePresetMeta;
  progress?: (_phase: string, _percentage: number, _message?: string) => void;
}

export interface EngineCapabilities {
  name: string;
  formats: string[];
  features: {
    headers: boolean;
    footers: boolean;
    pageBreaks: boolean;
    watermarks: boolean;
    customFonts: boolean;
    tableOfContents: boolean;
  };
}

export abstract class BaseExportEngine implements ExportEngine {
  abstract name: string;
  abstract capabilities: EngineCapabilities;

  abstract render(draft: ManuscriptDraft, style: StylePresetMeta): Promise<Blob>;

  protected reportProgress(
    _progress: ((phase: string, _percentage: number, _message?: string) => void) | undefined,
    phase: string,
    percentage: number,
    message?: string,
  ): void {
    if (_progress) {
      _progress(phase, percentage, message);
    }
  }

  protected sanitizeFileName(title: string): string {
    return title
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '_')
      .toLowerCase();
  }

  protected replaceTemplateTokens(
    template: string,
    context: Record<string, string | number>,
  ): string {
    let result = template;

    for (const [key, value] of Object.entries(context)) {
      const token = `{${key}}`;
      result = result.replace(new RegExp(token, 'g'), String(value));
    }

    return result;
  }

  protected countWords(text: string): number {
    return text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
  }

  protected estimatePages(wordCount: number, wordsPerPage: number = 250): number {
    return Math.ceil(wordCount / wordsPerPage);
  }
}
