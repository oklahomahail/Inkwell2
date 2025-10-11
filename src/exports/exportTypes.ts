/**
 * Export format types and interfaces
 */

// exportTypes.ts - Core types for professional publishing exports

export type ExportFormat = 'PDF' | 'DOCX' | 'EPUB';

export interface ExportResult {
  blob: Blob;
  fileName: string;
  downloadUrl: string;
  metadata: {
    format: ExportFormat;
    style: string;
    wordCount: number;
    pageCount: number; // required to satisfy subsequent declarations
    fileSize: number;
    generatedAt: number;
  };
}

export interface ExportJobConfig {
  id: string;
  projectId: string;
  format: ExportFormat;
  style: string;
  includeProofread?: boolean;
}

export type ExportJobStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled';

export interface ExportJob extends ExportJobConfig {
  status: ExportJobStatus;
  startedAt?: number;
  finishedAt?: number;
  fileName?: string;
  downloadUrl?: string;
  artifactSize?: number;
  error?: string;
  progress?: {
    phase: 'assembling' | 'proofreading' | 'rendering' | 'finalizing';
    percentage: number;
    message?: string;
  };
}

// Export base error types
import { ExportError, ExportValidationError } from './errors';

export { ExportError, ExportValidationError };

export class ExportRenderError extends ExportError {
  constructor(message: string, _format: ExportFormat, details?: any) {
    super(message, 'RENDER_ERROR', 'rendering', details);
    this.name = 'ExportRenderError';
  }
}

export interface StylePresetMeta {
  id: string; // 'classic-manuscript'
  label: string; // 'Classic Manuscript'
  description: string;
  baseFont: 'Garamond' | 'Times New Roman' | 'Inter' | 'Georgia';
  fontSizePt: number; // 12
  lineSpacing: 1 | 1.15 | 1.5 | 2;
  marginsIn: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  header: {
    left?: string;
    center?: string;
    right?: string;
  };
  footer: {
    left?: string;
    center?: string;
    right?: string;
  };
  watermark?: {
    svgPath: string;
    opacity: number;
    position: 'center' | 'top-right' | 'bottom-right';
  };
  sceneBreak: string; // '***' or '⁂'
  chapterPageBreak: boolean;
}

export interface ManuscriptChapter {
  number: number;
  title?: string;
  scenes: string[]; // compiled rich text → cleaned HTML/markdown/plain depending on engine
}

export interface ManuscriptFrontMatter {
  dedication?: string;
  acknowledgements?: string;
  epigraph?: string;
}

export interface ManuscriptBackMatter {
  aboutAuthor?: string;
  notes?: string;
}

export interface ManuscriptDraft {
  title: string;
  author?: string;
  projectId: string;
  chapters: ManuscriptChapter[];
  frontMatter?: ManuscriptFrontMatter;
  backMatter?: ManuscriptBackMatter;
  metadata?: Record<string, string>;
  wordCount: number;
  estimatedPages: number;
}

// Template variable replacement context
export interface TemplateContext {
  title: string;
  author?: string;
  chapterTitle?: string;
  chapterNumber?: number;
  page?: number;
  totalPages?: number;
  date?: string;
  projectName?: string;
}

// Export readiness criteria
export interface ExportReadinessCheck {
  isReady: boolean;
  score: number; // 0-100
  criteria: {
    hasTitle: boolean;
    hasContent: boolean;
    hasChapters: boolean;
    minWordCount: boolean;
    chaptersHaveTitles: boolean;
    noBlockingIssues: boolean;
  };
  recommendations: string[];
}

export interface ExportSettings {
  defaultFormat: ExportFormat;
  defaultStyle: string;
  includeProofreadByDefault: boolean;
  autoDownload: boolean;
  compressionLevel: 'low' | 'medium' | 'high';
  watermarkEnabled: boolean;
}

// Analytics events for exports
export interface ExportAnalyticsEvents {
  'export.started': {
    projectId: string;
    format: ExportFormat;
    style: string;
    includeProofread: boolean;
    wordCount: number;
  };
  'export.completed': {
    projectId: string;
    format: ExportFormat;
    durationMs: number;
    artifactSize: number;
    pageCount?: number;
  };
  'export.failed': {
    projectId: string;
    format: ExportFormat;
    error: string;
    phase: string;
  };
  'export.cancelled': {
    projectId: string;
    format: ExportFormat;
    phase: string;
  };
}

// Error types for exports
