// @ts-nocheck
// Search Web Worker implementation
import {
  type IndexStats,
  type SearchResult,
  type WorkerMessage,
  type WorkerResponse,
} from '@/services/searchWorkerService';

/// <reference lib="webworker" />

declare var self: DedicatedWorkerGlobalScope;

// Simple in-memory index for demo
const index = new Map<string, { projectId: string; content: string }>();

function _buildIndex(message: Extract<WorkerMessage, { type: 'BUILD_INDEX' }>): void {
  const { projectId, project, chapters } = message;

  // Index project data
  index.set(`project:${projectId}`, {
    projectId,
    content: JSON.stringify(project),
  });

  // Index chapters
  chapters.forEach((chapter: any) => {
    index.set(`chapter:${chapter.id}`, {
      projectId,
      content: JSON.stringify(chapter),
    });
  });

  self.postMessage({
    type: 'BUILD_INDEX_RESULT',
    success: true,
    stats: {
      totalDocuments: index.size,
      indexSize: 0,
      lastUpdate: Date.now(),
      queryCount: 0,
      averageLatency: 0,
    } as IndexStats,
    timeMs: 0,
    ...(message.requestId ? { requestId: message.requestId } : {}),
  } satisfies WorkerResponse);
}

function _search(message: Extract<WorkerMessage, { type: 'SEARCH_QUERY' }>): void {
  const { projectId, query, options, requestId } = message;

  const results: SearchResult[] = [];
  const start = performance.now();

  // Simple text search
  for (const [key, doc] of index.entries()) {
    if (doc.projectId !== projectId) continue;

    const content = doc.content.toLowerCase();
    const queryLower = query.toLowerCase();

    if (content.includes(queryLower)) {
      const [type] = key.split(':') as ['scene' | 'chapter' | 'character' | 'plot'];

      if (!options.types.includes(type)) continue;

      results.push({
        id: key,
        type,
        title: 'Matching Document',
        content: doc.content,
        excerpt: content.substring(0, 100),
        score: 1,
        projectId,
      });

      if (results.length >= options.maxResults) break;
    }
  }

  const base = {
    type: 'SEARCH_RESULT' as const,
    results,
    latencyMs: performance.now() - start,
  };
  const msg = requestId ? { ...base, requestId } : base;
  self.postMessage(msg satisfies WorkerResponse);
}

// Message handler setup
self.addEventListener('message', (event) => {
  const message = event.data as WorkerMessage;

  try {
    switch (message.type) {
      case 'BUILD_INDEX':
        buildIndex(message);
        break;

      case 'SEARCH_QUERY':
        search(message);
        break;

      case 'UPDATE_DOCUMENT':
        // TODO: Implement document updates
        self.postMessage({
          type: 'UPDATE_RESULT',
          success: true,
          ...(message.requestId ? { requestId: message.requestId } : {}),
        } satisfies WorkerResponse);
        break;

      case 'GET_STATS':
        self.postMessage({
          type: 'STATS_RESULT',
          stats: {
            totalDocuments: index.size,
            indexSize: 0,
            lastUpdate: Date.now(),
            queryCount: 0,
            averageLatency: 0,
          } as IndexStats,
          ...(message.requestId ? { requestId: message.requestId } : {}),
        } satisfies WorkerResponse);
        break;

      case 'CLEAR_PROJECT':
        // Remove project documents from index
        for (const [key, doc] of index.entries()) {
          if (doc.projectId === message.projectId) {
            index.delete(key);
          }
        }
        self.postMessage({
          type: 'CLEAR_RESULT',
          success: true,
          ...(message.requestId ? { requestId: message.requestId } : {}),
        } satisfies WorkerResponse);
        break;

      case 'CANCEL':
        // No-op in this simple implementation
        break;

      default:
        throw new Error(`Unknown message type: ${(message as any).type}`);
    }
  } catch (error) {
    self.postMessage({
      type: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error',
      ...(message.requestId ? { requestId: message.requestId } : {}),
    } satisfies WorkerResponse);
  }
});
