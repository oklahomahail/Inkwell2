// exportController.ts - Orchestrates the full export pipeline

import {
  ExportJob,
  ExportResult,
  ExportFormat,
  ExportError,
  ExportValidationError,
} from './exportTypes';
import { generateFileName, createDownloadUrl } from './exportUtils';
import { assembleManuscript, validateManuscriptForExport } from './manuscriptAssembler';

// Analytics integration - would import from your analytics service
interface AnalyticsService {
  track: (event: string, data: any) => void;
}

// Mock analytics - replace with actual service
const analytics: AnalyticsService = {
  track: (event: string, data: any) => {
    console.log(`Analytics: ${event}`, data);
  },
};

// Job queue for managing exports
class ExportJobQueue {
  private jobs = new Map<string, ExportJob>();
  private listeners = new Map<string, Set<(job: ExportJob) => void>>();

  add(job: ExportJob) {
    this.jobs.set(job.id, job);
    this.notifyListeners(job);
  }

  update(jobId: string, updates: Partial<ExportJob>) {
    const job = this.jobs.get(jobId);
    if (job) {
      const updatedJob = { ...job, ...updates };
      this.jobs.set(jobId, updatedJob);
      this.notifyListeners(updatedJob);
    }
  }

  get(jobId: string): ExportJob | undefined {
    return this.jobs.get(jobId);
  }

  getAll(): ExportJob[] {
    return Array.from(this.jobs.values());
  }

  subscribe(jobId: string, callback: (job: ExportJob) => void) {
    if (!this.listeners.has(jobId)) {
      this.listeners.set(jobId, new Set());
    }
    this.listeners.get(jobId)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(jobId)?.delete(callback);
    };
  }

  private notifyListeners(job: ExportJob) {
    this.listeners.get(job.id)?.forEach((callback) => callback(job));
  }
}

const jobQueue = new ExportJobQueue();

/**
 * Creates and queues a new export job
 */
export function createExportJob(
  projectId: string,
  format: ExportFormat,
  styleId: string,
  includeProofread: boolean = false,
): ExportJob {
  const job: ExportJob = {
    id: `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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

/**
 * Gets the current status of an export job
 */
export function getExportJob(jobId: string): ExportJob | undefined {
  return jobQueue.get(jobId);
}

/**
 * Gets all export jobs for a project
 */
export function getExportJobsForProject(projectId: string): ExportJob[] {
  return jobQueue.getAll().filter((job) => job.projectId === projectId);
}

/**
 * Subscribes to job updates
 */
export function subscribeToJob(jobId: string, callback: (job: ExportJob) => void) {
  return jobQueue.subscribe(jobId, callback);
}

/**
 * Updates job progress
 */
function updateJobProgress(
  jobId: string,
  phase: 'assembling' | 'proofreading' | 'rendering' | 'finalizing',
  percentage: number,
  message?: string,
) {
  jobQueue.update(jobId, {
    progress: { phase, percentage, message },
  });
}

/**
 * Main export function that orchestrates the entire pipeline
 */
export async function runExport(jobId: string): Promise<ExportResult> {
  const job = jobQueue.get(jobId);
  if (!job) {
    throw new ExportError('Job not found', 'JOB_NOT_FOUND', 'assembling');
  }

  try {
    // Mark job as running
    jobQueue.update(jobId, {
      status: 'running',
      startedAt: Date.now(),
    });

    analytics.track('export.started', {
      projectId: job.projectId,
      format: job.format,
      style: job.style,
      includeProofread: job.includeProofread,
      wordCount: 0, // Will be updated after assembly
    });

    // Phase 1: Assemble manuscript
    updateJobProgress(jobId, 'assembling', 10, 'Compiling manuscript from project data...');

    const draft = await assembleManuscript(job.projectId);

    // Validate manuscript
    const validation = validateManuscriptForExport(draft);
    if (!validation.isValid) {
      throw new ExportValidationError('Manuscript validation failed', validation.errors);
    }

    updateJobProgress(jobId, 'assembling', 25, 'Manuscript compiled successfully');

    // Update analytics with actual word count
    analytics.track('export.started', {
      projectId: job.projectId,
      format: job.format,
      style: job.style,
      includeProofread: job.includeProofread,
      wordCount: draft.wordCount,
    });

    let workingDraft = draft;
    let proofreadReport = undefined;

    // Phase 2: Optional proofreading
    if (job.includeProofread) {
      updateJobProgress(jobId, 'proofreading', 30, 'Running AI proofread...');

      try {
        // Import and run proofread service
        const { runProofread } = await import('./proofread/proofreadService');
        proofreadReport = await runProofread(draft);

        updateJobProgress(jobId, 'proofreading', 50, 'Proofread completed');

        // Apply suggestions to working draft if configured
        // This would be implemented based on user preferences
      } catch (proofreadError) {
        console.warn('Proofread failed:', proofreadError);
        updateJobProgress(jobId, 'proofreading', 50, 'Proofread skipped due to error');
      }
    }

    // Phase 3: Load style preset
    updateJobProgress(jobId, 'rendering', 55, 'Loading style preset...');

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
    updateJobProgress(jobId, 'rendering', 60, `Rendering ${job.format} document...`);

    let engine;
    try {
      switch (job.format) {
        case 'PDF':
          const { pdfEngine } = await import('./exportEngines/pdfEngine');
          engine = pdfEngine;
          break;
        case 'DOCX':
          const { docxEngine } = await import('./exportEngines/docxEngine');
          engine = docxEngine;
          break;
        case 'EPUB':
          const { epubEngine } = await import('./exportEngines/epubEngine');
          engine = epubEngine;
          break;
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

    updateJobProgress(jobId, 'rendering', 80, 'Generating document...');

    const blob = await engine.render(workingDraft, stylePreset);

    // Phase 5: Finalize
    updateJobProgress(jobId, 'finalizing', 90, 'Creating download link...');

    const fileName = generateFileName(workingDraft.title, job.format, workingDraft.author);
    const downloadUrl = await createDownloadUrl(blob, fileName);

    updateJobProgress(jobId, 'finalizing', 100, 'Export completed successfully');

    // Create result
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
      },
    };

    // Update job as completed
    jobQueue.update(jobId, {
      status: 'succeeded',
      finishedAt: Date.now(),
      fileName,
      downloadUrl,
      artifactSize: blob.size,
    });

    // Track completion analytics
    analytics.track('export.completed', {
      projectId: job.projectId,
      format: job.format,
      durationMs: Date.now() - (job.startedAt || Date.now()),
      artifactSize: blob.size,
      pageCount: workingDraft.estimatedPages,
    });

    return result;
  } catch (error) {
    // Mark job as failed
    const err = error instanceof Error ? error : new Error(String(error));
    jobQueue.update(jobId, {
      status: 'failed',
      finishedAt: Date.now(),
      error: err.message,
    });

    // Track failure analytics
    analytics.track('export.failed', {
      projectId: job.projectId,
      format: job.format,
      error: error instanceof Error ? error.message : String(error),
      phase: error instanceof ExportError ? error.phase : 'unknown',
    });

    throw error;
  }
}

/**
 * Cancels a running export job
 */
export function cancelExportJob(jobId: string): boolean {
  const job = jobQueue.get(jobId);
  if (!job || job.status !== 'running') {
    return false;
  }

  jobQueue.update(jobId, {
    status: 'cancelled',
    finishedAt: Date.now(),
  });

  analytics.track('export.cancelled', {
    projectId: job.projectId,
    format: job.format,
    phase: (job.progress && job.progress.phase) || 'unknown',
  });

  return true;
}

/**
 * Gets export statistics for a project
 */
export function getExportStats(projectId: string) {
  const jobs = getExportJobsForProject(projectId);

  const stats = {
    totalExports: jobs.length,
    successfulExports: jobs.filter((j) => j.status === 'succeeded').length,
    failedExports: jobs.filter((j) => j.status === 'failed').length,
    averageDuration: 0,
    formatBreakdown: {} as Record<ExportFormat, number>,
    recentExports: jobs
      .filter((j) => j.status === 'succeeded')
      .sort((a, b) => (b.finishedAt || 0) - (a.finishedAt || 0))
      .slice(0, 5),
  };

  // Calculate average duration for successful exports
  const successfulJobs = jobs.filter(
    (j) => j.status === 'succeeded' && j.startedAt && j.finishedAt,
  );

  if (successfulJobs.length > 0) {
    const totalDuration = successfulJobs.reduce(
      (sum, job) => sum + (job.finishedAt! - job.startedAt!),
      0,
    );
    stats.averageDuration = totalDuration / successfulJobs.length;
  }

  // Format breakdown
  jobs.forEach((job) => {
    stats.formatBreakdown[job.format] = (stats.formatBreakdown[job.format] || 0) + 1;
  });

  return stats;
}
