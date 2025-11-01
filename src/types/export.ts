/**
 * Export Types (v0.7.0)
 *
 * Type definitions for export records and export history tracking.
 */

export interface ExportRecord {
  id: string;
  projectId: string;
  type: 'pdf' | 'docx' | 'markdown';
  chaptersIncluded: {
    id: string;
    title: string;
    position: number;
  }[];
  totalWordCount: number;
  durationMs: number;
  createdAt: string; // ISO timestamp
  result: 'success' | 'fail';
  errorMessage?: string;
}

export interface ExportHistoryStats {
  totalExports: number;
  successfulExports: number;
  failedExports: number;
  lastExportTime: string | null;
  lastExportWordCount: number;
  averageDurationMs: number;
  totalWordsExported: number;
}

export interface CreateExportRecordParams {
  projectId: string;
  type: 'pdf' | 'docx' | 'markdown';
  chaptersIncluded: {
    id: string;
    title: string;
    position: number;
  }[];
  totalWordCount: number;
  durationMs: number;
  result: 'success' | 'fail';
  errorMessage?: string;
}
