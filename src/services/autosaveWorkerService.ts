// src/services/autosaveWorkerService.ts
/**
 * AutosaveWorkerService
 *
 * Manages autosave Web Worker lifecycle and provides a clean async API.
 *
 * Usage:
 * ```ts
 * const service = AutosaveWorkerService.getInstance();
 * const prepared = await service.prepareDocument(id, content, version, scenes);
 * await Chapters.saveDoc(prepared);
 * ```
 *
 * Benefits:
 * - Singleton pattern ensures single worker instance
 * - Automatic worker initialization
 * - Promise-based API for easy integration
 * - Automatic cleanup on page unload
 */

import type {
  AutosaveRequest,
  AutosavePrepareResponse,
  WorkerResponse,
} from '@/workers/autosaveWorker';

export class AutosaveWorkerService {
  private static instance: AutosaveWorkerService | null = null;
  private worker: Worker | null = null;
  private pendingRequests = new Map<
    string,
    { resolve: (response: AutosavePrepareResponse) => void; reject: (error: Error) => void }
  >();

  constructor() {
    this.initWorker();
    this.setupCleanup();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): AutosaveWorkerService {
    if (!AutosaveWorkerService.instance) {
      AutosaveWorkerService.instance = new AutosaveWorkerService();
    }
    return AutosaveWorkerService.instance;
  }

  /**
   * Initialize Web Worker
   */
  private initWorker(): void {
    try {
      this.worker = new Worker(new URL('@/workers/autosaveWorker.ts', import.meta.url), {
        type: 'module',
      });

      this.worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        const response = event.data;

        if (response.type === 'prepare-complete') {
          const pending = this.pendingRequests.get(response.id);
          if (pending) {
            pending.resolve(response);
            this.pendingRequests.delete(response.id);
          }
        } else if (response.type === 'error') {
          const pending = this.pendingRequests.get(response.id);
          if (pending) {
            pending.reject(new Error(response.error));
            this.pendingRequests.delete(response.id);
          }
        }
      };

      this.worker.onerror = (error) => {
        console.error('[AutosaveWorker] Worker error:', error);
        // Reject all pending requests
        for (const [id, pending] of this.pendingRequests.entries()) {
          pending.reject(new Error('Worker error'));
          this.pendingRequests.delete(id);
        }
        // Disable worker for future requests to use main thread fallback
        this.worker = null;
      };
    } catch (error) {
      console.error('[AutosaveWorker] Failed to initialize worker:', error);
    }
  }

  /**
   * Setup automatic cleanup
   */
  private setupCleanup(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.destroy();
      });
    }
  }

  /**
   * Prepare document for saving (runs in Web Worker)
   *
   * @param id - Chapter/section ID
   * @param content - Raw content string
   * @param version - Document version
   * @param currentScenes - Optional existing scenes array
   * @returns Prepared document ready for IndexedDB
   */
  async prepareDocument(
    id: string,
    content: string,
    version: number,
    currentScenes?: any[],
  ): Promise<AutosavePrepareResponse['preparedDoc']> {
    // Fallback to main thread if worker not available
    if (!this.worker) {
      console.warn('[AutosaveWorker] Worker not available, running on main thread');
      return this.prepareDocumentMainThread(id, content, version, currentScenes);
    }

    return new Promise((resolve, reject) => {
      // Store pending request
      this.pendingRequests.set(id, {
        resolve: (response) => resolve(response.preparedDoc),
        reject,
      });

      // Send request to worker
      const request: AutosaveRequest = {
        type: 'prepare',
        id,
        content,
        version,
        currentScenes,
      };

      this.worker!.postMessage(request);

      // Timeout after 5 seconds with fallback to main thread
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          console.warn('[AutosaveWorker] Worker timeout, falling back to main thread');
          resolve(this.prepareDocumentMainThread(id, content, version, currentScenes));
        }
      }, 5000);
    });
  }

  /**
   * Fallback: Prepare document on main thread
   * Used when Web Worker is not available
   */
  private prepareDocumentMainThread(
    id: string,
    content: string,
    version: number,
    currentScenes?: any[],
  ): AutosavePrepareResponse['preparedDoc'] {
    // Simple sanitization
    const sanitized = content.replace(/\0/g, '').trimEnd();

    // Simple checksum
    let hash = 0;
    for (let i = 0; i < sanitized.length; i++) {
      hash = (hash << 5) - hash + sanitized.charCodeAt(i);
      hash |= 0;
    }
    const checksum = Math.abs(hash).toString(36);

    // Content size
    const contentSize = new Blob([sanitized]).size;

    return {
      id,
      content: sanitized,
      version,
      scenes: currentScenes || [],
      contentSize,
      checksum,
    };
  }

  /**
   * Check if worker is available and ready
   */
  isWorkerAvailable(): boolean {
    return this.worker !== null;
  }

  /**
   * Get count of pending requests (for debugging/monitoring)
   */
  getPendingCount(): number {
    return this.pendingRequests.size;
  }

  /**
   * Destroy worker and cleanup
   */
  destroy(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }

    // Reject all pending requests
    for (const [id, pending] of this.pendingRequests.entries()) {
      pending.reject(new Error('Worker destroyed'));
      this.pendingRequests.delete(id);
    }
  }
}

// Export singleton instance
export const autosaveWorker = AutosaveWorkerService.getInstance();
