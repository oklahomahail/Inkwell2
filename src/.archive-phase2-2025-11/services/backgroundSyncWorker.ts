// src/services/backgroundSyncWorker.ts
// Background sync worker with exponential backoff and conflict queue

import { FEATURES } from '@/config/features';
import devLog from '@/utils/devLog';

import { SyncService } from './syncService';

export type SyncJobStatus = 'pending' | 'running' | 'success' | 'error';

export interface SyncJob {
  id: string;
  projectId: string;
  type: 'push' | 'pull';
  status: SyncJobStatus;
  attempt: number;
  lastError?: string;
  createdAt: number;
  nextRetryAt?: number;
}

export interface SyncWorkerConfig {
  intervalMs: number; // Base sync interval (default: 60s)
  maxRetries: number; // Max retry attempts (default: 5)
  backoffMultiplier: number; // Exponential backoff multiplier (default: 2)
  maxBackoffMs: number; // Max backoff time (default: 5 minutes)
}

const DEFAULT_CONFIG: SyncWorkerConfig = {
  intervalMs: 60_000, // 60 seconds
  maxRetries: 5,
  backoffMultiplier: 2,
  maxBackoffMs: 5 * 60 * 1000, // 5 minutes
};

export class BackgroundSyncWorker {
  private sync: SyncService;
  private projectId: string;
  private config: SyncWorkerConfig;

  private queue: SyncJob[] = [];
  private timer: number | undefined;
  private running = false;
  private paused = false;

  // Telemetry
  private stats = {
    totalPushes: 0,
    totalPulls: 0,
    failedPushes: 0,
    failedPulls: 0,
    avgPushDurationMs: 0,
    avgPullDurationMs: 0,
    totalBytesTransferred: 0,
  };

  constructor(sync: SyncService, projectId: string, config?: Partial<SyncWorkerConfig>) {
    this.sync = sync;
    this.projectId = projectId;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Start background sync worker
   */
  start(): void {
    if (!FEATURES.backgroundSync) {
      devLog.warn('[BackgroundSyncWorker] Background sync is disabled');
      return;
    }

    if (this.running) {
      devLog.warn('[BackgroundSyncWorker] Already running');
      return;
    }

    this.running = true;
    this.paused = false;
    devLog.log('[BackgroundSyncWorker] Started', {
      projectId: this.projectId,
      config: this.config,
    });

    this.scheduleNextTick();
  }

  /**
   * Stop background sync worker
   */
  stop(): void {
    this.running = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }
    devLog.log('[BackgroundSyncWorker] Stopped');
  }

  /**
   * Pause sync (e.g., when offline)
   */
  pause(): void {
    this.paused = true;
    devLog.log('[BackgroundSyncWorker] Paused');
  }

  /**
   * Resume sync
   */
  resume(): void {
    this.paused = false;
    devLog.log('[BackgroundSyncWorker] Resumed');
    if (this.running) {
      this.scheduleNextTick();
    }
  }

  /**
   * Manually trigger sync now
   */
  async syncNow(): Promise<void> {
    await this.tick();
  }

  /**
   * Get current stats (for telemetry)
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Get current queue
   */
  getQueue(): SyncJob[] {
    return [...this.queue];
  }

  /**
   * Schedule next tick
   */
  private scheduleNextTick(): void {
    if (!this.running || this.paused) return;

    // Check if there are any pending retries sooner than the interval
    const nextRetry = this.queue
      .filter((j) => j.status === 'error' && j.nextRetryAt)
      .map((j) => j.nextRetryAt!)
      .sort((a, b) => a - b)[0];

    const delay =
      nextRetry && nextRetry < Date.now() + this.config.intervalMs
        ? Math.max(0, nextRetry - Date.now())
        : this.config.intervalMs;

    this.timer = window.setTimeout(() => this.tick(), delay);
  }

  /**
   * Main sync tick
   */
  private async tick(): Promise<void> {
    if (!this.running || this.paused) return;

    try {
      // Process pending jobs first
      await this.processQueue();

      // Then add new push/pull jobs
      const pushJob = this.createJob('push');
      const pullJob = this.createJob('pull');

      this.queue.push(pushJob, pullJob);

      await this.processQueue();
    } catch (error) {
      devLog.error('[BackgroundSyncWorker] Tick failed:', error);
    } finally {
      this.scheduleNextTick();
    }
  }

  /**
   * Process job queue
   */
  private async processQueue(): Promise<void> {
    // Filter jobs that are ready to run
    const now = Date.now();
    const readyJobs = this.queue.filter(
      (j) =>
        j.status === 'pending' || (j.status === 'error' && j.nextRetryAt && j.nextRetryAt <= now),
    );

    for (const job of readyJobs) {
      await this.processJob(job);
    }

    // Remove successful jobs older than 1 minute
    const cutoff = now - 60_000;
    this.queue = this.queue.filter((j) => !(j.status === 'success' && j.createdAt < cutoff));
  }

  /**
   * Process a single job
   */
  private async processJob(job: SyncJob): Promise<void> {
    if (job.attempt >= this.config.maxRetries) {
      devLog.error('[BackgroundSyncWorker] Max retries exceeded', job);
      job.status = 'error';
      job.lastError = 'Max retries exceeded';
      return;
    }

    job.status = 'running';
    job.attempt++;

    const startTime = performance.now();

    try {
      if (job.type === 'push') {
        await this.sync.pushNow(this.projectId);
        this.stats.totalPushes++;
        this.stats.avgPushDurationMs = this.updateAvg(
          this.stats.avgPushDurationMs,
          performance.now() - startTime,
          this.stats.totalPushes,
        );
      } else {
        await this.sync.pullNow(this.projectId);
        this.stats.totalPulls++;
        this.stats.avgPullDurationMs = this.updateAvg(
          this.stats.avgPullDurationMs,
          performance.now() - startTime,
          this.stats.totalPulls,
        );
      }

      job.status = 'success';
      job.lastError = undefined;
      devLog.log(`[BackgroundSyncWorker] ${job.type} succeeded`, { attempt: job.attempt });
    } catch (error: unknown) {
      job.status = 'error';
      job.lastError = error instanceof Error ? error.message : String(error);

      if (job.type === 'push') {
        this.stats.failedPushes++;
      } else {
        this.stats.failedPulls++;
      }

      // Calculate exponential backoff
      const backoffMs = Math.min(
        this.config.intervalMs * Math.pow(this.config.backoffMultiplier, job.attempt - 1),
        this.config.maxBackoffMs,
      );
      job.nextRetryAt = Date.now() + backoffMs;

      devLog.warn(`[BackgroundSyncWorker] ${job.type} failed, retry in ${backoffMs}ms`, {
        attempt: job.attempt,
        error: job.lastError,
      });
    }
  }

  /**
   * Create a new sync job
   */
  private createJob(type: 'push' | 'pull'): SyncJob {
    return {
      id: `${type}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      projectId: this.projectId,
      type,
      status: 'pending',
      attempt: 0,
      createdAt: Date.now(),
    };
  }

  /**
   * Update running average
   */
  private updateAvg(currentAvg: number, newValue: number, count: number): number {
    return (currentAvg * (count - 1) + newValue) / count;
  }
}

/**
 * Create and start background sync worker for a project
 */
export function startBackgroundSync(
  sync: SyncService,
  projectId: string,
  config?: Partial<SyncWorkerConfig>,
): BackgroundSyncWorker {
  const worker = new BackgroundSyncWorker(sync, projectId, config);
  worker.start();
  return worker;
}
