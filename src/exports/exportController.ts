// exportController.ts - Orchestrates the full export pipeline

import {
  ExportJob,
  ExportResult,
  ExportFormat,
  ExportError,
  ExportValidationError,
} from './exportTypes';
import {
  _generateFileName as generateFileName,
  _createDownloadUrl as createDownloadUrl,
} from './exportUtils';
import { assembleManuscript, validateManuscriptForExport } from './manuscriptAssembler';

// ---- Analytics integration (mock) ----
interface AnalyticsService {
  track: (event: string, data: unknown) => void;
}

const analytics: AnalyticsService = {
  track: (event: string, data: unknown) => {
    // Replace with your real analytics service

    console.log(`Analytics: ${event}`, data);
  },
};

// ---- Job queue & subscriptions ----
class ExportJobQueue {
  private jobs = new Map<string, ExportJob>();
  private listeners = new Map<string, Set<(job: ExportJob) => void>>();

  add(job: ExportJob) {
    this.jobs.set(job.id, job);
    this.notify(job);
  }

  update(jobId: string, updates: Partial<ExportJob>) {
    const job = this.jobs.get(jobId);
    if (!job) return;
    const next: ExportJob = { ...job, ...updates };
    this.jobs.set(jobId, next);
    this.notify(next);
  }

  get(jobId: string): ExportJob | undefined {
    return this.jobs.get(jobId);
  }

  getAll(): ExportJob[] {
    return Array.from(this.jobs.values());
  }

  /** Subscribe to updates for a specific job id; returns an unsubscribe fn. */
  subscribe(jobId: string, listener: (job: ExportJob) => void): () => void {
    let set = this.listeners.get(jobId);
    if (!set) {
      set = new Set();
      this.listeners.set(jobId, set);
    }
    set.add(listener);
    return () => {
      const s = this.listeners.get(jobId);
      if (!s) return;
      s.delete(listener);
      if (s.size === 0) this.listeners.delete(jobId);
    };
  }

  private notify(job: ExportJob) {
    const set = this.listeners.get(job.id);
    if (!set) return;
    for (const cb of set) cb(job);
  }
}

const jobQueue = new ExportJobQueue();

// ---- Public API ----

/** Creates and queues a new export job */
export function _createExportJob(
  projectId: string,
  format: ExportFormat,
  styleId: string,
  includeProofread = false,
): ExportJob {
  const job: ExportJob = {
    id: `export_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
    projectId,
    format,
    style: styleId,
    includeProofread,
    status: 'queued',
    startedAt: Date.now(),
  };
  jobQueue.add(job);
  return job;
}

/** Gets the current status of an export job */
export function _getExportJob(jobId: string): ExportJob | undefined {
  return jobQueue.get(jobId);
}

/** Gets all export jobs for a project */
export function _getExportJobsForProject(projectId: string): ExportJob[] {
  return jobQueue.getAll().filter((job) => job.projectId === projectId);
}

/** Subscribes to job updates */
export function _subscribeToJob(jobId: string, callback: (job: ExportJob) => void) {
  return jobQueue.subscribe(jobId, callback);
}

/** Updates job progress (internal) */
function _updateJobProgress(
  jobId: string,
  phase: 'assembling' | 'proofreading' | 'rendering' | 'finalizing',
  percentage: number,
  message?: string,
) {
  jobQueue.update(jobId, {
    progress: {
      phase,
      percentage,
      ...(message ? { message } : {}),
    },
  });
}

/** Main export function that orchestrates the entire pipeline */
export async function _runExport(jobId: string): Promise<ExportResult> {
  const job = jobQueue.get(jobId);
  if (!job) throw new ExportError('Job not found', 'JOB_NOT_FOUND', 'assembling');

  try {
    // Mark job as running
    jobQueue.update(jobId, { status: 'running', startedAt: Date.now() });

    analytics.track('export.started', {
      projectId: job.projectId,
      format: job.format,
      style: job.style,
      includeProofread: job.includeProofread,
      wordCount: 0, // updated after assembly
    });

    // Phase 1: Assemble manuscript
    _updateJobProgress(jobId, 'assembling', 10, 'Compiling manuscript from project data...');
    const draft = await assembleManuscript(job.projectId);

    // Validate manuscript
    const validation = validateManuscriptForExport(draft);
    if (!validation.isValid) {
      throw new ExportValidationError('Manuscript validation failed', validation.errors);
    }
    _updateJobProgress(jobId, 'assembling', 25, 'Manuscript compiled successfully');

    // Update analytics with actual word count
    analytics.track('export.started', {
      projectId: job.projectId,
      format: job.format,
      style: job.style,
      includeProofread: job.includeProofread,
      wordCount: draft.wordCount,
    });

    let workingDraft = draft;
    let proofreadReport: unknown | undefined;

    // Phase 2: Optional proofreading
    if (job.includeProofread) {
      _updateJobProgress(jobId, 'proofreading', 30, 'Running AI proofread...');
      try {
        const { runProofread } = await import('./proofread/proofreadService');
        proofreadReport = await runProofread(draft);
        // In the future, merge suggestions into workingDraft as desired
        _updateJobProgress(jobId, 'proofreading', 50, 'Proofread completed');
      } catch (proofreadError) {
        console.warn('Proofread failed:', proofreadError);
        _updateJobProgress(jobId, 'proofreading', 50, 'Proofread skipped due to error');
      }
    }

    // Phase 3: Load style preset
    _updateJobProgress(jobId, 'rendering', 55, 'Loading style preset...');
    const { getStylePreset } = await import('./exportTemplates/presets');
    const stylePreset = await getStylePreset(job.style);
    if (!stylePreset) {
      throw new ExportError(
        `Style preset '${job.style}' not found`,
        'STYLE_NOT_FOUND',
        'rendering',
      );
    }

    // Phase 4: Render to target format
    _updateJobProgress(jobId, 'rendering', 60, `Rendering ${job.format} document...`);

    let engine: { render: (draft: any, style: any) => Promise<Blob> };
    try {
      switch (job.format) {
        case 'PDF': {
          const { pdfEngine } = await import('./exportEngines/pdfEngine');
          engine = pdfEngine;
          break;
        }
        case 'DOCX': {
          const { docxEngine } = await import('./exportEngines/docxEngine');
          engine = docxEngine;
          break;
        }
        case 'EPUB': {
          const { epubEngine } = await import('./exportEngines/epubEngine');
          engine = epubEngine;
          break;
        }
        default:
          throw new ExportError(
            `Unsupported format: ${job.format}`,
            'UNSUPPORTED_FORMAT',
            'rendering',
          );
      }
    } catch (importError) {
      const err = importError instanceof Error ? importError : new Error(String(importError));
      throw new ExportError(
        `Failed to load ${job.format} engine: ${err.message}`,
        'ENGINE_LOAD_ERROR',
        'rendering',
        err,
      );
    }

    _updateJobProgress(jobId, 'rendering', 80, 'Generating document...');
    const blob = await engine.render(workingDraft, stylePreset);

    // Phase 5: Finalize
    _updateJobProgress(jobId, 'finalizing', 90, 'Creating download link...');
    const fileName = generateFileName(workingDraft.title, job.format, workingDraft.author);
    const downloadUrl = await createDownloadUrl(blob, fileName);
    _updateJobProgress(jobId, 'finalizing', 100, 'Export completed successfully');

    const result: ExportResult = {
      blob,
      fileName,
      downloadUrl,
      metadata: {
        format: job.format,
        style: job.style,
        wordCount: workingDraft.wordCount,
        pageCount: workingDraft.estimatedPages,
        fileSize: blob.size,
        generatedAt: Date.now(),
        // optionally include proofreadReport flag
        ...(proofreadReport ? { proofread: true } : {}),
      },
    };

    jobQueue.update(jobId, {
      status: 'succeeded',
      finishedAt: Date.now(),
      fileName,
      downloadUrl,
      artifactSize: blob.size,
    });

    analytics.track('export.completed', {
      projectId: job.projectId,
      format: job.format,
      durationMs: Date.now() - (job.startedAt || Date.now()),
      artifactSize: blob.size,
      pageCount: workingDraft.estimatedPages,
    });

    return result;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    jobQueue.update(jobId, {
      status: 'failed',
      finishedAt: Date.now(),
      error: err.message,
    });

    analytics.track('export.failed', {
      projectId: job?.projectId,
      format: job?.format,
      error: err.message,
      phase: error instanceof ExportError ? error.phase : 'unknown',
    });

    throw err;
  }
}

/** Cancels a running export job */
export function _cancelExportJob(jobId: string): boolean {
  const job = jobQueue.get(jobId);
  if (!job || job.status !== 'running') return false;

  jobQueue.update(jobId, { status: 'cancelled', finishedAt: Date.now() });

  analytics.track('export.cancelled', {
    projectId: job.projectId,
    format: job.format,
    phase: job.progress?.phase ?? 'unknown',
  });

  return true;
}

/** Gets export statistics for a project */
export function _getExportStats(projectId: string) {
  const jobs = _getExportJobsForProject(projectId);

  const stats = {
    totalExports: jobs.length,
    successfulExports: jobs.filter((j) => j.status === 'succeeded').length,
    failedExports: jobs.filter((j) => j.status === 'failed').length,
    averageDuration: 0,
    formatBreakdown: {} as Record<ExportFormat, number>,
    recentExports: jobs
      .filter((j) => j.status === 'succeeded')
      .sort((a, b) => (b.finishedAt ?? 0) - (a.finishedAt ?? 0))
      .slice(0, 5),
  };

  const successfulJobs = jobs.filter(
    (j) => j.status === 'succeeded' && j.startedAt != null && j.finishedAt != null,
  );

  if (successfulJobs.length > 0) {
    const totalDuration = successfulJobs.reduce(
      (sum, j) => sum + ((j.finishedAt as number) - (j.startedAt as number)),
      0,
    );
    stats.averageDuration = totalDuration / successfulJobs.length;
  }

  for (const j of jobs) {
    stats.formatBreakdown[j.format] = (stats.formatBreakdown[j.format] || 0) + 1;
  }

  return stats;
}
