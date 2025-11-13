// src/services/searchService.ts
/**
 * SearchService - Manages search Web Worker lifecycle and provides async API
 *
 * Usage:
 * ```ts
 * const service = SearchService.getInstance();
 * const results = await service.search('fantasy adventure');
 * ```
 */

import devLog from '@/utils/devLog';
import type { SearchRequest, SearchResponse, SearchResult } from '@/workers/searchWorker';

class SearchServiceClass {
  private static instance: SearchServiceClass | null = null;
  private worker: Worker | null = null;
  private pendingRequests = new Map<
    number,
    { resolve: (response: SearchResponse) => void; reject: (error: Error) => void }
  >();
  private requestId = 0;

  private constructor() {
    this.initWorker();
    this.setupCleanup();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): SearchServiceClass {
    if (!SearchServiceClass.instance) {
      SearchServiceClass.instance = new SearchServiceClass();
    }
    return SearchServiceClass.instance;
  }

  /**
   * Initialize Web Worker
   */
  private initWorker(): void {
    try {
      this.worker = new Worker(new URL('@/workers/searchWorker.ts', import.meta.url), {
        type: 'module',
      });

      this.worker.onmessage = (event: MessageEvent<SearchResponse>) => {
        const response = event.data;

        // Find and resolve the corresponding pending request
        // Since we can't send requestId in the worker response easily,
        // we'll use a FIFO approach (first pending request)
        const firstRequest = this.pendingRequests.values().next().value;
        if (firstRequest) {
          const requestId = Array.from(this.pendingRequests.keys())[0];
          if (requestId !== undefined) {
            this.pendingRequests.delete(requestId);
          }

          if (response.type === 'error') {
            firstRequest.reject(new Error(response.error || 'Search worker error'));
          } else {
            firstRequest.resolve(response);
          }
        }
      };

      this.worker.onerror = (error) => {
        devLog.error('[SearchService] Worker error:', error);

        // Reject all pending requests
        for (const [id, pending] of this.pendingRequests.entries()) {
          pending.reject(new Error('Worker error'));
          this.pendingRequests.delete(id);
        }
      };

      devLog.debug('[SearchService] Search worker initialized');
    } catch (error) {
      devLog.error('[SearchService] Failed to initialize worker:', error);
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
   * Send request to worker
   */
  private sendRequest(request: SearchRequest): Promise<SearchResponse> {
    if (!this.worker) {
      return Promise.reject(new Error('Search worker not available'));
    }

    return new Promise((resolve, reject) => {
      const id = this.requestId++;
      this.pendingRequests.set(id, { resolve, reject });

      this.worker!.postMessage(request);

      // Timeout after 10 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('Search timeout'));
        }
      }, 10000);
    });
  }

  /**
   * Search across projects
   *
   * @param query - Search query string
   * @returns Array of search results sorted by relevance
   */
  async search(query: string): Promise<SearchResult[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }

    try {
      const response = await this.sendRequest({
        type: 'search',
        query: query.trim(),
      });

      if (response.type === 'search-results') {
        devLog.debug(
          `[SearchService] Found ${response.results?.length || 0} results in ${response.duration}ms`,
        );
        return response.results || [];
      }

      return [];
    } catch (error) {
      devLog.error('[SearchService] Search failed:', error);
      return [];
    }
  }

  /**
   * Update a project in the search index
   *
   * @param projectData - Project data to index
   */
  async updateProject(projectData: SearchRequest['projectData']): Promise<void> {
    if (!projectData) return;

    try {
      await this.sendRequest({
        type: 'update-project',
        projectData,
      });

      devLog.debug(`[SearchService] Updated project index: ${projectData.id}`);
    } catch (error) {
      devLog.error('[SearchService] Failed to update project index:', error);
    }
  }

  /**
   * Remove a project from the search index
   *
   * @param projectId - ID of project to remove
   */
  async removeProject(projectId: string): Promise<void> {
    try {
      await this.sendRequest({
        type: 'remove-project',
        projectId,
      });

      devLog.debug(`[SearchService] Removed project from index: ${projectId}`);
    } catch (error) {
      devLog.error('[SearchService] Failed to remove project from index:', error);
    }
  }

  /**
   * Get search index statistics
   *
   * @returns Index stats (project count, word count, size)
   */
  async getStats(): Promise<SearchResponse['stats']> {
    try {
      const response = await this.sendRequest({
        type: 'get-stats',
      });

      if (response.type === 'stats') {
        return response.stats;
      }

      return undefined;
    } catch (error) {
      devLog.error('[SearchService] Failed to get stats:', error);
      return undefined;
    }
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
      devLog.debug('[SearchService] Worker terminated');
    }

    // Reject all pending requests
    for (const [id, pending] of this.pendingRequests.entries()) {
      pending.reject(new Error('Worker destroyed'));
      this.pendingRequests.delete(id);
    }
  }
}

// Export singleton instance
export const SearchService = SearchServiceClass.getInstance();
