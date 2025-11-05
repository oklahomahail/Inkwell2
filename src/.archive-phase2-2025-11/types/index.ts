/**
 * Shared type definitions for the Inkwell application
 *
 * ⚠️ CANONICAL TYPE EXPORTS (v0.6.0+)
 * ====================================
 * This file exports the canonical types that should be used throughout the app.
 * DO NOT import from types/project.ts, types/writing.ts, or types/persistence.ts directly.
 * Always import from types/index.ts to ensure type consistency.
 */

// ============================================
// CANONICAL PROJECT TYPES
// ============================================

export type {
  Project,
  EnhancedProject,
  Chapter,
  Character,
  CharacterRole,
  CharacterRelationship,
  PlotNote,
  PlotNoteType,
  NotePriority,
  NoteStatus,
  WorldBuildingNote,
  WorldBuildingType,
  ChapterStatus,
  RelationshipType,
  WritingSession,
  ContextLength,
} from './project';

// ============================================
// CHAPTER MANAGEMENT TYPES
// ============================================

export type {
  ChapterMeta,
  ChapterDoc,
  FullChapter,
  CreateChapterInput,
  UpdateChapterInput,
} from './writing';

// ============================================
// DEPRECATED TYPES (v0.6.0 Migration)
// ============================================

/**
 * @deprecated Scene-based writing is deprecated.
 * Use Chapter.content instead of nested scenes.
 * Will be removed in v0.7.0
 */
export type { Scene, SceneStatus } from './writing';

/**
 * @deprecated Use EnhancedProject instead
 * Will be removed in v0.7.0
 */
export type { WritingProject } from './writing';

// ============================================
// SHARED TYPES
// ============================================

// Theme types
export type Theme = 'light' | 'dark';

// Export types
// Import ExportFormat enum from writing types
export type { ExportFormat, ExportRequest } from './writing';
export type LegacyExportFormat = 'PDF' | 'DOCX' | 'EPUB';

export type ExportJobStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled';

export interface ExportJobProgress {
  phase: 'assembling' | 'proofreading' | 'rendering' | 'finalizing';
  percentage: number;
  message?: string;
}

export interface ExportJobConfig {
  id: string;
  projectId: string;
  format: LegacyExportFormat;
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
    format: LegacyExportFormat;
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
