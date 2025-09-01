// src/services/searchWorkerService.ts
// Main thread service for communicating with the search Web Worker

import type { EnhancedProject } from '@/types/project';
import type { Chapter } from '@/types/writing';
// If your worker exports these types, keep the import. If not, the local
// fallback types below are compatible with the shapes we use.
// import type { WorkerMessage, SearchResult, IndexStats } from "@/workers/searchWorker";

export interface SearchOptions {
  types?: Array<'scene' | 'chapter' | 'character' | 'plot'>;
  maxResults?: number;
  minScore?: number;
}

export interface SearchResult {
  id: string;
  type: 'scene' | 'chapter' | 'character' | 'plot';
  title: string;
  content: string;
  excerpt: string;
  score: number;
  projectId: string;
  chapterId?: string;
  metadata?: {
    wordCount?: number;
    status?: string;
    lastModified?: Date;
  };
}

export interface IndexStats {
  totalDocuments: number;
  indexSize: number;
  lastUpdate: number;
  queryCount: number;
  averageLatency: number;
}

/** Worker message envelope (request) */
type WorkerMessage =
  | {
      type: 'BUILD_INDEX';
      projectId: string;
      project: EnhancedProject;
      chapters: Chapter[];
      requestId?: string;
    }
  | {
      type: 'SEARCH_QUERY';
      projectId: string;
      query: string;
      options: Required<SearchOptions>;
      requestId?: string;
    }
  | {
      type: 'UPDATE_DOCUMENT';
      projectId: string;
      documentId: string;
      title: string;
      content: string;
      requestId?: string;
    }
  | {
      type: 'GET_STATS';
      projectId: string;
      requestId?: string;
    }
  | {
      type: 'CLEAR_PROJECT';
      projectId: string;
      requestId?: string;
    }
  | {
      // optional cancel proto; worker may ignore safely
      type: 'CANCEL';
      idPattern?: string; // stringified regex
      requestId?: string;
    };

/** Worker response envelope (supports both with/without requestId) */
type WorkerResponse =
  | {
      type: 'BUILD_INDEX_RESULT';
      success: boolean;
      stats: IndexStats;
      timeMs: number;
      requestId?: string;
    }
  | {
      type: 'SEARCH_RESULT';
      results: SearchResult[];
      latencyMs?: number;
      requestId?: string;
    }
  | {
      type: 'UPDATE_RESULT';
      success: boolean;
      requestId?: string;
    }
  | {
      type: 'STATS_RESULT';
      stats: IndexStats | null;
      requestId?: string;
    }
  | {
      type: 'CLEAR_RESULT';
      success: boolean;
      requestId?: string;
    }
  | {
      type: 'ERROR';
      error: string;
      requestId?: string;
    };

/** Pending operation tracker */
type PendingOp = {
  type: WorkerMessage['type'];
  resolve: (v: any) => void;
  reject: (e: any) => void;
  timeout: ReturnType<typeof setTimeout>;
};

class SearchWorkerService {
  private worker: Worker | null = null;
  private ready = false;
  private initialized = false;

  private messageId = 0;
  private pending = new Map<string, PendingOp>(); // key: requestId
  private pendingByType = new Map<WorkerMessage['type'], string>(); // one-per-type fallback
  private queue: Array<{
    message: WorkerMessage;
    resolve: (v: any) => void;
    reject: (e: any) => void;
  }> = [];

  // Performance metrics
  private latencies: number[] = [];
  private queries: string[] = [];

  constructor() {
    this.init();
  }

  // ---------- Public API ----------

  async initializeProject(
    projectId: string,
    project: EnhancedProject,
    chapters: Chapter[],
  ): Promise<{ success: boolean; stats: IndexStats; timeMs: number }> {
    try {
      const res = await this.send<Extract<WorkerResponse, { type: 'BUILD_INDEX_RESULT' }>>({
        type: 'BUILD_INDEX',
        projectId,
        project,
        chapters,
      });
      if (res.success) {
        console.log(
          `Index built for ${projectId}: ${res.stats.totalDocuments} docs in ${res.timeMs.toFixed(
            1,
          )}ms`,
        );
      }
      return { success: res.success, stats: res.stats, timeMs: res.timeMs };
    } catch (err) {
      console.error(`Failed to initialize search for ${projectId}:`, err);
      return {
        success: false,
        stats: {
          totalDocuments: 0,
          indexSize: 0,
          lastUpdate: Date.now(),
          queryCount: 0,
          averageLatency: 0,
        },
        timeMs: 0,
      };
    }
  }

  async search(
    projectId: string,
    query: string,
    options: SearchOptions = {},
  ): Promise<SearchResult[]> {
    const start = this.now();
    const trimmed = query.trim();
    if (!trimmed) return [];

    try {
      const res = await this.send<Extract<WorkerResponse, { type: 'SEARCH_RESULT' }>>({
        type: 'SEARCH_QUERY',
        projectId,
        query: trimmed,
        options: {
          types: options.types ?? ['scene', 'chapter', 'character', 'plot'],
          maxResults: options.maxResults ?? 20,
          minScore: options.minScore ?? 0.1,
        },
      });

      const latency = this.now() - start;
      this.latencies.push(latency);
      this.queries.push(trimmed);
      if (this.latencies.length > 100) {
        this.latencies = this.latencies.slice(-100);
        this.queries = this.queries.slice(-100);
      }

      console.log(
        `Search "${trimmed}" -> ${res.results.length} results in ${latency.toFixed(1)}ms`,
      );
      return res.results;
    } catch (err) {
      console.error('Search failed:', err);
      return [];
    }
  }

  async updateDocument(
    projectId: string,
    documentId: string,
    title: string,
    content: string,
  ): Promise<boolean> {
    try {
      const res = await this.send<Extract<WorkerResponse, { type: 'UPDATE_RESULT' }>>({
        type: 'UPDATE_DOCUMENT',
        projectId,
        documentId,
        title,
        content,
      });
      if (res.success) {
        console.log(`Updated document ${documentId} in worker index`);
      }
      return res.success;
    } catch (err) {
      console.error('Document update failed:', err);
      return false;
    }
  }

  async getStats(projectId: string): Promise<IndexStats | null> {
    try {
      const res = await this.send<Extract<WorkerResponse, { type: 'STATS_RESULT' }>>({
        type: 'GET_STATS',
        projectId,
      });
      return res.stats ?? null;
    } catch (err) {
      console.error('Failed to get stats:', err);
      return null;
    }
  }

  async clearProject(projectId: string): Promise<boolean> {
    try {
      const res = await this.send<Extract<WorkerResponse, { type: 'CLEAR_RESULT' }>>({
        type: 'CLEAR_PROJECT',
        projectId,
      });
      if (res.success) {
        console.log(`Cleared search data for project ${projectId}`);
      }
      return res.success;
    } catch (err) {
      console.error('Failed to clear project:', err);
      return false;
    }
  }

  /** Optional: cancel in-flight searches (useful on fast typing). Worker may ignore. */
  cancelSearch(idPattern = /^SEARCH_QUERY/): void {
    this.postIfReady({ type: 'CANCEL', idPattern: idPattern.source });
    // Reject local pending of type SEARCH_QUERY
    for (const [reqId, op] of Array.from(this.pending.entries())) {
      if (idPattern.test(op.type)) {
        clearTimeout(op.timeout);
        op.reject(new Error('cancelled'));
        this.pending.delete(reqId);
        if (this.pendingByType.get(op.type) === reqId) this.pendingByType.delete(op.type);
      }
    }
  }

  getPerformanceMetrics(): { p50: number; p95: number; queries: number } {
    if (!this.latencies.length) return { p50: 0, p95: 0, queries: 0 };
    const sorted = [...this.latencies].sort((a, b) => a - b);
    const at = (p: number) =>
      sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))] || 0;
    return { p50: at(0.5), p95: at(0.95), queries: this.latencies.length };
  }

  getWorkerStatus(): {
    ready: boolean;
    initialized: boolean;
    pendingOperations: number;
    queuedMessages: number;
  } {
    return {
      ready: this.ready,
      initialized: this.initialized,
      pendingOperations: this.pending.size,
      queuedMessages: this.queue.length,
    };
  }

  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    // reject all pending
    for (const [reqId, op] of this.pending) {
      clearTimeout(op.timeout);
      op.reject(new Error('Worker terminated'));
      this.pending.delete(reqId);
    }
    this.pendingByType.clear();
    this.ready = false;
    this.initialized = false;
    this.queue = [];

    console.log('SearchWorkerService: Terminated');
  }

  // ---------- Internals ----------

  private init(): void {
    if (!this.supportsWorker()) {
      console.warn('SearchWorkerService: Web Worker not supported in this environment');
      this.ready = false;
      this.initialized = false;
      return;
    }

    try {
      this.worker = new Worker(new URL('../workers/searchWorker.ts', import.meta.url), {
        type: 'module',
      });
      this.worker.addEventListener('message', this.onMessage);
      this.worker.addEventListener('error', this.onError);
      this.worker.addEventListener('messageerror', this.onMessageError);

      this.ready = true;
      this.initialized = true;
      // drain any queued messages
      this.drainQueue();

      console.log('SearchWorkerService: Worker initialized');
    } catch (err) {
      console.error('SearchWorkerService: Failed to initialize worker:', err);
      this.recover(err);
    }
  }

  private supportsWorker(): boolean {
    return typeof window !== 'undefined' && typeof Worker !== 'undefined';
  }

  private now(): number {
    return typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
  }

  private onMessage = (event: MessageEvent<WorkerResponse>) => {
    const resp = event.data;
    const reqId = (resp as any).requestId as string | undefined;
    const fromType = resp.type as WorkerMessage['type'];

    if (reqId && this.pending.has(reqId)) {
      this.resolvePending(reqId, resp);
      return;
    }

    // Fallback path: if worker doesn't echo requestId, resolve the sole pending of this type.
    const pendingId = this.pendingByType.get(fromType);
    if (pendingId && this.pending.has(pendingId)) {
      this.resolvePending(pendingId, resp);
      return;
    }

    console.warn('SearchWorkerService: Unexpected message (no matching pending op):', resp);
  };

  private onError = (event: ErrorEvent) => {
    console.error('SearchWorkerService: Worker error:', event.error);
    this.recover(event.error);
  };

  private onMessageError = (event: MessageEvent) => {
    console.error('SearchWorkerService: Worker message error:', event.data);
  };

  private recover(error: unknown): void {
    // Reject all pending
    for (const [reqId, op] of this.pending) {
      clearTimeout(op.timeout);
      op.reject(new Error(`Worker failed: ${(error as any)?.message ?? 'Unknown error'}`));
      this.pending.delete(reqId);
    }
    this.pendingByType.clear();
    this.ready = false;

    // Attempt re-init after a short delay
    setTimeout(() => this.init(), 1000);
  }

  private resolvePending(reqId: string, resp: WorkerResponse): void {
    const op = this.pending.get(reqId);
    if (!op) return;

    clearTimeout(op.timeout);
    this.pending.delete(reqId);
    if (this.pendingByType.get(op.type) === reqId) this.pendingByType.delete(op.type);

    if (resp.type === 'ERROR') {
      op.reject(new Error((resp as any).error || 'Worker error'));
      return;
    }
    op.resolve(resp);
  }

  private async drainQueue(): Promise<void> {
    if (!this.ready || !this.worker || !this.queue.length) return;

    const q = [...this.queue];
    this.queue = [];
    for (const item of q) {
      try {
        const res = await this._send(item.message);
        item.resolve(res);
      } catch (err) {
        item.reject(err);
      }
    }
  }

  private postIfReady(message: WorkerMessage): void {
    if (this.ready && this.worker) {
      try {
        this.worker.postMessage(message);
      } catch (err) {
        console.error('SearchWorkerService: postMessage failed:', err);
      }
    }
  }

  private send<T>(message: WorkerMessage): Promise<T> {
    if (!this.ready || !this.worker) {
      // queue until worker is ready (e.g., SSR hydration)
      return new Promise<T>((resolve, reject) => {
        this.queue.push({ message, resolve, reject });
      });
    }
    return this._send<T>(message);
  }

  private _send<T>(message: WorkerMessage): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const requestId = `${message.type}_${++this.messageId}`;
      (message as any).requestId = requestId;

      // Enforce single-pending-per-type to allow type-based fallback routing
      const existing = this.pendingByType.get(message.type);
      if (existing) {
        const prev = this.pending.get(existing);
        if (prev) {
          clearTimeout(prev.timeout);
          prev.reject(new Error('superseded'));
          this.pending.delete(existing);
        }
      }
      this.pendingByType.set(message.type, requestId);

      const timeout = setTimeout(() => {
        this.pending.delete(requestId);
        if (this.pendingByType.get(message.type) === requestId) {
          this.pendingByType.delete(message.type);
        }
        reject(new Error(`Operation ${message.type} timed out`));
      }, 30_000);

      this.pending.set(requestId, { type: message.type, resolve, reject, timeout });

      try {
        this.worker!.postMessage(message);
      } catch (err) {
        clearTimeout(timeout);
        this.pending.delete(requestId);
        if (this.pendingByType.get(message.type) === requestId) {
          this.pendingByType.delete(message.type);
        }
        reject(err);
      }
    });
  }
}

// Export singleton instance
export const searchWorkerService = new SearchWorkerService();

// For debugging
declare global {
  interface Window {
    searchWorkerService?: SearchWorkerService;
  }
}

if (typeof window !== 'undefined') {
  window.searchWorkerService = searchWorkerService;
}
