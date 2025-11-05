// @ts-nocheck
// Search worker service
import type { EnhancedProject } from '@/types/project';
import type { Chapter } from '@/types/writing';
import devLog from '@/utils/devLog';

// For compatibility with older TypeScript
declare var _WorkerGlobalScope: any;

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
export type WorkerMessage =
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
      type: 'CANCEL';
      idPattern?: string;
      requestId?: string;
    };

/** Worker response envelope */
export type WorkerResponse =
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
  resolve: (_v: any) => void;
  reject: (_e: any) => void;
  timeout: ReturnType<typeof setTimeout>;
};

export class SearchWorkerService {
  private worker: Worker | null = null;
  private ready = false;
  private initialized = false;
  private messageId = 0;
  private pending = new Map<string, PendingOp>();
  private pendingByType = new Map<WorkerMessage['type'], string>();
  private queue: Array<{
    message: WorkerMessage;
    resolve: (_v: any) => void;
    reject: (_e: any) => void;
  }> = [];
  private latencies: number[] = [];
  private queries: string[] = [];

  constructor() {
    this.init();
  }

  async init() {
    try {
      this.worker = new Worker(new URL('../workers/search.worker.ts', import.meta.url), {
        type: 'module',
      });

      this.worker.addEventListener('message', (e) => {
        const response = e.data;
        const pendingOp = response.requestId ? this.pending.get(response.requestId) : null;

        if (pendingOp) {
          clearTimeout(pendingOp.timeout);
          this.pending.delete(response.requestId!);
          if (this.pendingByType.get(pendingOp.type) === response.requestId) {
            this.pendingByType.delete(pendingOp.type);
          }

          if (response.type === 'ERROR') {
            pendingOp.reject(new Error(response.error));
          } else {
            pendingOp.resolve(response);
          }
        }
      });

      this.worker.addEventListener('error', (e) => {
        devLog.error('Search worker error:', e);
        // Reject all pending operations
        for (const [reqId, op] of this.pending) {
          clearTimeout(op.timeout);
          op.reject(new Error('Worker error'));
          this.pending.delete(reqId);
          if (this.pendingByType.get(op.type) === reqId) {
            this.pendingByType.delete(op.type);
          }
        }
        this.ready = false;
      });

      this.ready = true;
      this.initialized = true;
    } catch (error) {
      devLog.error('Failed to initialize search worker:', error);
      throw error;
    }
  }

  getWorkerStatus() {
    return {
      ready: this.ready,
      initialized: this.initialized,
      pendingOperations: this.pending.size,
      queuedMessages: this.queue.length,
    };
  }

  getPerformanceMetrics() {
    const avg = this.latencies.length
      ? this.latencies.reduce((a, b) => a + b, 0) / this.latencies.length
      : 0;
    return {
      totalDocuments: 0,
      indexSize: 0,
      lastUpdate: Date.now(),
      queryCount: this.queries.length,
      averageLatency: avg,
      usingWorker: true,
    };
  }

  async initializeProject(projectId: string, project: EnhancedProject, chapters: Chapter[]) {
    // send build index message
    const reqId = String(this.messageId++);
    const msg: WorkerMessage = {
      type: 'BUILD_INDEX',
      projectId,
      project,
      chapters,
      requestId: reqId,
    };
    return this.send(msg);
  }

  async updateDocument(projectId: string, documentId: string, title: string, content: string) {
    const reqId = String(this.messageId++);
    const msg: WorkerMessage = {
      type: 'UPDATE_DOCUMENT',
      projectId,
      documentId,
      title,
      content,
      requestId: reqId,
    };
    const res = await this.send(msg);
    return res?.success ?? true;
  }

  private send(message: WorkerMessage): Promise<any> {
    if (!this.worker || !this.ready) return Promise.reject(new Error('Search worker not ready'));
    const requestId = message.requestId ?? String(this.messageId++);
    message.requestId = requestId;
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(requestId);
        reject(new Error('Worker request timeout'));
      }, 15000);
      this.pending.set(requestId, {
        type: message.type,
        resolve,
        reject,
        timeout,
      });
      this.pendingByType.set(message.type, requestId);
      this.worker!.postMessage(message);
    });
  }

  async search(
    projectId: string,
    query: string,
    options: SearchOptions = {},
  ): Promise<SearchResult[]> {
    if (!this.ready) {
      throw new Error('Search worker not ready');
    }

    const requestId = String(this.messageId++);
    const message: WorkerMessage = {
      type: 'SEARCH_QUERY',
      projectId,
      query,
      options: {
        types: options.types ?? ['scene', 'chapter', 'character', 'plot'],
        maxResults: options.maxResults ?? 20,
        minScore: options.minScore ?? 0.1,
      },
      requestId,
    };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(requestId);
        reject(new Error('Search timeout'));
      }, 30000);

      this.pending.set(requestId, {
        type: message.type,
        resolve: (response) => {
          if (response.type === 'SEARCH_RESULT') {
            resolve(response.results);
          } else {
            reject(new Error('Invalid response type'));
          }
        },
        reject,
        timeout,
      });

      this.worker?.postMessage(message);
    });
  }

  // Add other methods as needed
}

// Export singleton instance
export const searchWorkerService = new SearchWorkerService();
