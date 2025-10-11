/**
 * Shared type definitions for the Inkwell application
 */

// Theme types
export type Theme = 'light' | 'dark';

// Export types
export type ExportFormat = 'PDF' | 'DOCX' | 'EPUB';

export type ExportJobStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled';

export interface ExportJobProgress {
  phase: 'assembling' | 'proofreading' | 'rendering' | 'finalizing';
  percentage: number;
  message?: string;
}

export interface ExportJobConfig {
  id: string;
  projectId: string;
  format: ExportFormat;
  style: string;
  includeProofread?: boolean;
}

export interface ExportJob extends ExportJobConfig {
  status: ExportJobStatus;
  startedAt?: number;
  finishedAt?: number;
  fileName?: string;
  downloadUrl?: string;
  artifactSize?: number;
  error?: string;
  progress?: ExportJobProgress;
}

export interface ExportResult {
  blob: Blob;
  fileName: string;
  downloadUrl: string;
  metadata: {
    format: ExportFormat;
    style: string;
    wordCount: number;
    pageCount: number;
    fileSize: number;
    generatedAt: number;
  };
}

// Error classes
export class ExportError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly phase: ExportJobProgress['phase'],
    public readonly originalError?: Error,
  ) {
    super(message);
  }
}

export class ExportValidationError extends ExportError {
  constructor(
    message: string,
    public readonly errors: string[],
  ) {
    super(message, 'VALIDATION_ERROR', 'assembling');
  }
}

// Feature flag types
export type FeatureCategory = 'core' | 'experimental' | 'debug';

export interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  defaultValue: boolean;
  category: FeatureCategory;
  requiresReload?: boolean;
}

export type FeatureFlagConfig = Record<string, FeatureFlag>;

// Worker types
export interface WorkerMessage<T = unknown> {
  type: string;
  payload?: T;
}
