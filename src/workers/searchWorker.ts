// src/workers/searchWorker.ts

// Web Worker for search indexing and querying

// Allow TS to understand the worker global
export {}; // keep this a module
declare const self: DedicatedWorkerGlobalScope;

import type { EnhancedProject } from '../types/project';
import type { Chapter } from '../types/writing';

// Message types for communication between main thread and worker
export interface IndexBuildMessage {
  type: 'BUILD_INDEX';
  projectId: string;
  project: EnhancedProject;
  chapters: Chapter[];
}

export interface SearchQueryMessage {
  type: 'SEARCH_QUERY';
  projectId: string;
  query: string;
  options: {
    types?: Array<'scene' | 'chapter' | 'character' | 'plot'>;
    maxResults?: number;
    minScore?: number;
  };
}

export interface UpdateDocumentMessage {
  type: 'UPDATE_DOCUMENT';
  projectId: string;
  documentId: string;
  title: string;
  content: string;
}

export interface GetStatsMessage {
  type: 'GET_STATS';
  projectId: string;
}

export interface ClearProjectMessage {
  type: 'CLEAR_PROJECT';
  projectId: string;
}

export type WorkerMessage =
  | IndexBuildMessage
  | SearchQueryMessage
  | UpdateDocumentMessage
  | GetStatsMessage
  | ClearProjectMessage;

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

// Enhanced index entry with transferable buffer support
interface IndexEntry {
  term: string;
  documents: Array<{
    docId: string;
    frequency: number;
    positions: number[];
  }>;
}

// In-worker search engine implementation
class WorkerSearchEngine {
  private indexes = new Map<string, Map<string, IndexEntry>>();
  private documents = new Map<string, Map<string, SearchResult>>();
  private stats = new Map<string, IndexStats>();

  async buildIndex(
    message: IndexBuildMessage,
  ): Promise<{ success: boolean; stats: IndexStats; timeMs: number }> {
    const startTime = performance.now();
    const { projectId, project, chapters } = message;

    console.log(`Worker: Building index for project ${projectId}`);

    try {
      const index = new Map<string, IndexEntry>();
      const documents = new Map<string, SearchResult>();
      let totalDocuments = 0;

      // Index chapters and scenes using defensive adapter pattern
      chapters.forEach((chapter) => {
        // Index chapter itself
        const chapterResult: SearchResult = {
          id: chapter.id,
          type: 'chapter',
          title: chapter.title,
          content: chapter.scenes?.map((s) => s.content).join('\n\n') || '',
          excerpt: this.createExcerpt(chapter.title, 150),
          score: 0,
          projectId,
          metadata: {
            wordCount: chapter.totalWordCount,
            status: chapter.status,
            lastModified:
              chapter.updatedAt instanceof Date
                ? chapter.updatedAt
                : new Date(chapter.updatedAt || Date.now()),
          },
        };

        documents.set(chapter.id, chapterResult);
        this.indexDocument(index, chapter.id, chapter.title + '\n' + chapterResult.content);
        totalDocuments++;

        // Index individual scenes with defensive handling
        if (Array.isArray(chapter.scenes)) {
          chapter.scenes.forEach((scene) => {
            if (scene && typeof scene === 'object' && scene.id) {
              const sceneResult: SearchResult = {
                id: scene.id,
                type: 'scene',
                title: scene.title || 'Untitled Scene',
                content: scene.content || '',
                excerpt: this.createExcerpt(scene.content || '', 150),
                score: 0,
                projectId,
                chapterId: chapter.id,
                metadata: {
                  wordCount: scene.wordCount || 0,
                  status: scene.status || 'draft',
                  lastModified:
                    scene.updatedAt instanceof Date
                      ? scene.updatedAt
                      : new Date(scene.updatedAt || Date.now()),
                },
              };

              documents.set(scene.id, sceneResult);
              this.indexDocument(index, scene.id, sceneResult.title + '\n' + sceneResult.content);
              totalDocuments++;
            }
          });
        }
      });

      // Index characters if available
      if (project.characters && Array.isArray(project.characters)) {
        project.characters.forEach((character) => {
          const result: SearchResult = {
            id: character.id,
            type: 'character',
            title: character.name,
            content: `${character.description}\n${character.backstory}\n${character.personality?.join(' ') || ''}`,
            excerpt: this.createExcerpt(character.description, 150),
            score: 0,
            projectId,
          };

          documents.set(character.id, result);
          this.indexDocument(index, character.id, result.title + '\n' + result.content);
          totalDocuments++;
        });
      }

      // Store indexes
      this.indexes.set(projectId, index);
      this.documents.set(projectId, documents);

      const endTime = performance.now();
      const buildTime = endTime - startTime;

      // Update stats
      const stats: IndexStats = {
        totalDocuments,
        indexSize: this.calculateIndexSize(index),
        lastUpdate: Date.now(),
        queryCount: 0,
        averageLatency: 0,
      };
      this.stats.set(projectId, stats);

      console.log(
        `Worker: Index built for ${projectId}: ${totalDocuments} documents in ${buildTime.toFixed(1)}ms`,
      );

      return { success: true, stats, timeMs: buildTime };
    } catch (error) {
      console.error(`Worker: Failed to build index for ${projectId}:`, error);
      return {
        success: false,
        stats: {
          totalDocuments: 0,
          indexSize: 0,
          lastUpdate: Date.now(),
          queryCount: 0,
          averageLatency: 0,
        },
        timeMs: performance.now() - startTime,
      };
    }
  }

  async searchDocuments(
    message: SearchQueryMessage,
  ): Promise<{ results: SearchResult[]; latencyMs: number }> {
    const startTime = performance.now();
    const { projectId, query, options } = message;

    try {
      const index = this.indexes.get(projectId);
      const documents = this.documents.get(projectId);

      if (!index || !documents) {
        return { results: [], latencyMs: 0 };
      }

      const {
        types = ['scene', 'chapter', 'character', 'plot'],
        maxResults = 20,
        minScore = 0.1,
      } = options;

      // Parse and normalize query
      const terms = this.tokenize(query.toLowerCase());
      if (terms.length === 0) {
        return { results: [], latencyMs: 0 };
      }

      // Calculate BM25 scores
      const scores = new Map<string, number>();
      const docCount = documents.size;

      terms.forEach((term) => {
        const entry = index.get(term);
        if (!entry) return;

        const idf = Math.log(
          (docCount - entry.documents.length + 0.5) / (entry.documents.length + 0.5),
        );

        entry.documents.forEach((termDoc) => {
          const doc = documents.get(termDoc.docId);
          if (!doc || !types.includes(doc.type)) return;

          // BM25 parameters optimized for prose search
          const k1 = 1.2;
          const b = 0.75;
          const avgdl = this.getAverageDocumentLength(documents);
          const docLength = doc.content.length;
          const tf = termDoc.frequency;

          const score = (idf * (tf * (k1 + 1))) / (tf + k1 * (1 - b + b * (docLength / avgdl)));

          scores.set(termDoc.docId, (scores.get(termDoc.docId) || 0) + score);
        });
      });

      // Prepare results with highlighted excerpts
      const results: SearchResult[] = Array.from(scores.entries())
        .filter(([, score]) => score >= minScore)
        .sort(([, a], [, b]) => b - a)
        .slice(0, maxResults)
        .map(([docId, score]) => {
          const doc = documents.get(docId)!;
          return {
            ...doc,
            score,
            excerpt: this.highlightExcerpt(doc.content, terms),
          };
        });

      const endTime = performance.now();
      const latency = endTime - startTime;

      // Update stats
      const stats = this.stats.get(projectId);
      if (stats) {
        stats.queryCount++;
        stats.averageLatency =
          (stats.averageLatency * (stats.queryCount - 1) + latency) / stats.queryCount;
      }

      return { results, latencyMs: latency };
    } catch (error) {
      console.error('Worker: Search failed:', error);
      return { results: [], latencyMs: performance.now() - startTime };
    }
  }

  updateDocument(message: UpdateDocumentMessage): { success: boolean } {
    const { projectId, documentId, title, content } = message;

    try {
      const index = this.indexes.get(projectId);
      const documents = this.documents.get(projectId);
      if (!index || !documents) {
        return { success: false };
      }

      // Remove old document from index
      this.removeDocumentFromIndex(index, documentId);

      // Re-index with new content
      this.indexDocument(index, documentId, title + '\n' + content);

      // Update document store
      if (documents.has(documentId)) {
        const existing = documents.get(documentId)!;
        documents.set(documentId, {
          ...existing,
          title,
          content,
          excerpt: this.createExcerpt(content, 150),
          metadata: {
            ...existing.metadata,
            lastModified: new Date(),
          },
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Worker: Document update failed:', error);
      return { success: false };
    }
  }

  getStats(projectId: string): IndexStats | null {
    return this.stats.get(projectId) || null;
  }

  clearProject(projectId: string): { success: boolean } {
    try {
      this.indexes.delete(projectId);
      this.documents.delete(projectId);
      this.stats.delete(projectId);
      return { success: true };
    } catch (error) {
      console.error('Worker: Clear project failed:', error);
      return { success: false };
    }
  }

  // -------------------------
  // Private helper methods
  // -------------------------

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((term) => term.length > 2)
      .slice(0, 32); // Increased limit for better phrase matching
  }

  private indexDocument(index: Map<string, IndexEntry>, docId: string, content: string): void {
    const terms = this.tokenize(content);
    const termCounts = new Map<string, number>(); // (reserved for future TF manipulations)

    // Count term frequencies and positions
    terms.forEach((term, position) => {
      termCounts.set(term, (termCounts.get(term) || 0) + 1);

      if (!index.has(term)) {
        index.set(term, { term, documents: [] });
      }

      const entry = index.get(term)!;
      let docEntry = entry.documents.find((d) => d.docId === docId);
      if (!docEntry) {
        docEntry = { docId, frequency: 0, positions: [] };
        entry.documents.push(docEntry);
      }

      docEntry.frequency++;
      docEntry.positions.push(position);
    });
  }

  private removeDocumentFromIndex(index: Map<string, IndexEntry>, docId: string): void {
    index.forEach((entry) => {
      entry.documents = entry.documents.filter((d) => d.docId !== docId);
      if (entry.documents.length === 0) {
        index.delete(entry.term);
      }
    });
  }

  private createExcerpt(content: string, maxLength: number): string {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength - 3) + '...';
  }

  private highlightExcerpt(content: string, terms: string[]): string {
    let excerpt = this.createExcerpt(content, 300);
    terms.forEach((term) => {
      const regex = new RegExp(`\\b${this.escapeRegex(term)}\\b`, 'gi');
      excerpt = excerpt.replace(regex, '<mark>$&</mark>');
    });
    return excerpt;
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|\[\]\\]/g, (match) => '\\' + match);
  }

  private getAverageDocumentLength(documents: Map<string, SearchResult>): number {
    const lengths = Array.from(documents.values()).map((doc) => doc.content.length);
    return lengths.length > 0 ? lengths.reduce((sum, len) => sum + len, 0) / lengths.length : 100;
  }

  private calculateIndexSize(index: Map<string, IndexEntry>): number {
    let size = 0;
    index.forEach((entry) => {
      size += entry.term.length * 2;
      size += entry.documents.length * 24; // Approximate size per document entry
    });
    return size;
  }
}

// Worker instance
const searchEngine = new WorkerSearchEngine();

// Message handler
self.addEventListener('message', async (event: MessageEvent<WorkerMessage>) => {
  const message = event.data;

  try {
    switch (message.type) {
      case 'BUILD_INDEX': {
        const result = await searchEngine.buildIndex(message);
        self.postMessage({
          type: 'BUILD_INDEX_RESULT',
          success: result.success,
          stats: result.stats,
          timeMs: result.timeMs,
        });
        break;
      }

      case 'SEARCH_QUERY': {
        const result = await searchEngine.searchDocuments(message);
        self.postMessage({
          type: 'SEARCH_RESULT',
          results: result.results,
          latencyMs: result.latencyMs,
        });
        break;
      }

      case 'UPDATE_DOCUMENT': {
        const result = searchEngine.updateDocument(message);
        self.postMessage({
          type: 'UPDATE_RESULT',
          success: result.success,
        });
        break;
      }

      case 'GET_STATS': {
        const stats = searchEngine.getStats(message.projectId);
        self.postMessage({
          type: 'STATS_RESULT',
          stats,
        });
        break;
      }

      case 'CLEAR_PROJECT': {
        const result = searchEngine.clearProject(message.projectId);
        self.postMessage({
          type: 'CLEAR_RESULT',
          success: result.success,
        });
        break;
      }

      default:
        console.warn('Worker: Unknown message type:', (message as any).type);
    }
  } catch (error) {
    console.error('Worker: Message handling failed:', error);
    self.postMessage({
      type: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});
