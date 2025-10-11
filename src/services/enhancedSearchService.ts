// src/services/enhancedSearchService.ts
// Enhanced search service that prefers a Web Worker and cleanly falls back to main thread

import type { Chapter } from '@/types/writing';

import { searchWorkerService } from './searchWorkerService';
import { storageService } from './storageService';

/** Minimal shapes we index against (keeps us decoupled from app-wide types) */
type IndexedScene = {
  id: string;
  title: string;
  content: string;
  wordCount?: number;
  status?: string;
  updatedAt?: string | number | Date;
};

type IndexedChapter = {
  id: string;
  title: string;
  scenes: IndexedScene[];
  totalWordCount?: number;
  status?: string;
  updatedAt?: string | number | Date;
};

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

export interface SearchOptions {
  types?: Array<'scene' | 'chapter' | 'character' | 'plot'>;
  maxResults?: number;
  minScore?: number;
  projectId?: string;
}

export interface SearchStats {
  totalDocuments: number;
  indexSize: number;
  lastUpdate: number;
  queryCount: number;
  averageLatency: number;
  usingWorker: boolean;
  p50: number;
  p95: number;
  queries: number;
  workerStatus?: {
    ready: boolean;
    initialized: boolean;
    pendingOperations: number;
    queuedMessages: number;
  };
}

/** Inverted index types */
type TermDocEntry = { frequency: number; positions: number[] };
type TermEntry = { term: string; documents: Map<string, TermDocEntry> };

/** Fallback implementation for when worker is not available */
class MainThreadSearchEngine {
  private indexes = new Map<string, Map<string, TermEntry>>(); // projectId -> term index
  private documents = new Map<string, Map<string, SearchResult>>(); // projectId -> docId -> doc
  private stats = new Map<string, SearchStats>();
  private queryHistory: string[] = [];
  private performanceSamplesMs: number[] = [];

  private nowMs(): number {
    return typeof performance !== 'undefined' && typeof performance.now === 'function'
      ? performance.now()
      : Date.now();
  }

  async initializeProject(projectId: string): Promise<void> {
    if (this.indexes.has(projectId)) return;

    const startTime = this.nowMs();
    const index: Map<string, TermEntry> = new Map();
    const docs: Map<string, SearchResult> = new Map();

    try {
      const project = storageService.loadProject(projectId);
      const chapters = (await storageService.loadWritingChapters(projectId)) as IndexedChapter[];

      if (!project) throw new Error(`Project ${projectId} not found`);

      let totalDocuments = 0;

      chapters.forEach((chapter) => {
        const chapterContent = (chapter.scenes ?? []).map((s) => s.content || '').join('\n\n');

        const chapterResult: SearchResult = {
          id: chapter.id,
          type: 'chapter',
          title: chapter.title ?? '(Untitled Chapter)',
          content: chapterContent,
          excerpt: this.createExcerpt(chapter.title ?? '', 150),
          score: 0,
          projectId,
          metadata: {
            wordCount: chapter.totalWordCount,
            status: chapter.status,
            lastModified: chapter.updatedAt ? new Date(chapter.updatedAt) : undefined,
          },
        };

        docs.set(chapter.id, chapterResult);
        this.indexDocument(index, chapter.id, `${chapterResult.title}\n${chapterResult.content}`);
        totalDocuments++;

        (chapter.scenes ?? []).forEach((scene) => {
          const sceneResult: SearchResult = {
            id: scene.id,
            type: 'scene',
            title: scene.title ?? '(Untitled Scene)',
            content: scene.content ?? '',
            excerpt: this.createExcerpt(scene.content ?? '', 150),
            score: 0,
            projectId,
            chapterId: chapter.id,
            metadata: {
              wordCount: scene.wordCount,
              status: scene.status,
              lastModified: scene.updatedAt ? new Date(scene.updatedAt) : undefined,
            },
          };

          docs.set(scene.id, sceneResult);
          this.indexDocument(index, scene.id, `${sceneResult.title}\n${sceneResult.content}`);
          totalDocuments++;
        });
      });

      this.indexes.set(projectId, index);
      this.documents.set(projectId, docs);

      const indexTime = Math.round(this.nowMs() - startTime);
      const metrics = this.getPerformanceMetrics();
      this.stats.set(projectId, {
        totalDocuments,
        indexSize: this.calculateIndexSize(index),
        lastUpdate: Date.now(),
        queryCount: 0,
        averageLatency: 0,
        usingWorker: false,
        p50: metrics.p50,
        p95: metrics.p95,
        queries: metrics.queries,
      });

      console.log(
        `MainThread: Search index built for project ${projectId}: ${totalDocuments} documents in ${indexTime}ms`,
      );
    } catch (error) {
      console.error(`MainThread: Failed to initialize search for project ${projectId}:`, error);
      throw error;
    }
  }

  async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    const startTime = this.nowMs();
    const { projectId } = options;

    if (!projectId) throw new Error('Project ID is required');

    try {
      await this.initializeProject(projectId);
      const index = this.indexes.get(projectId);
      const docs = this.documents.get(projectId);

      if (!index || !docs) return [];

      const {
        types = ['scene', 'chapter', 'character', 'plot'],
        maxResults = 20,
        minScore = 0.1,
      } = options;

      const terms = this.tokenize(query);
      if (terms.length === 0) return [];

      const scores = new Map<string, number>();
      const docCount = docs.size;
      const avgdl = this.getAverageDocumentLength(docs);

      terms.forEach((term) => {
        const entry = index.get(term);
        if (!entry) return;

        const df = entry.documents.size;
        const idf = Math.log((docCount - df + 0.5) / (df + 0.5));

        entry.documents.forEach((termDoc, docId) => {
          const doc = docs.get(docId);
          if (!doc || !types.includes(doc.type)) return;

          // BM25-like scoring (simplified)
          const k1 = 1.2;
          const b = 0.75;
          const tf = termDoc.frequency;
          const docLength = Math.max(1, doc.content.length);
          const score =
            idf * ((tf * (k1 + 1)) / (tf + k1 * (1 - b + (b * docLength) / Math.max(1, avgdl))));

          scores.set(docId, (scores.get(docId) || 0) + score);
        });
      });

      const results: SearchResult[] = Array.from(scores.entries())
        .filter(([, score]) => score >= minScore)
        .sort(([, a], [, b]) => b - a)
        .slice(0, maxResults)
        .map(([docId, score]) => {
          const doc = docs.get(docId)!;
          return {
            ...doc,
            score,
            excerpt: this.highlightExcerpt(doc.content, terms),
          };
        });

      // metrics
      const latency = this.nowMs() - startTime;
      this.performanceSamplesMs.push(latency);
      this.queryHistory.push(query);
      if (this.queryHistory.length > 100) {
        this.queryHistory = this.queryHistory.slice(-100);
        this.performanceSamplesMs = this.performanceSamplesMs.slice(-100);
      }

      const s = this.stats.get(projectId);
      if (s) {
        const newCount = s.queryCount + 1;
        const newAvg =
          newCount === 1 ? latency : (s.averageLatency * s.queryCount + latency) / newCount;
        this.stats.set(projectId, {
          ...s,
          queryCount: newCount,
          averageLatency: newAvg,
          lastUpdate: Date.now(),
          indexSize: this.calculateIndexSize(index),
          totalDocuments: docs.size,
        });
      }

      return results;
    } catch (error) {
      console.error('MainThread: Search failed:', error);
      return [];
    }
  }

  /** Update a single document and re-index it */
  async updateDocument(
    projectId: string,
    documentId: string,
    title: string,
    content: string,
  ): Promise<void> {
    await this.initializeProject(projectId);

    const index = this.indexes.get(projectId);
    const docs = this.documents.get(projectId);
    const s = this.stats.get(projectId);

    if (!index || !docs) return;

    // Remove the doc from every term entry
    index.forEach((entry) => {
      entry.documents.delete(documentId);
    });

    // Update or create the SearchResult
    const existing = docs.get(documentId);
    const updated: SearchResult =
      existing ??
      ({
        id: documentId,
        type: 'scene',
        title,
        content,
        excerpt: '',
        score: 0,
        projectId,
      } as SearchResult);

    updated.title = title;
    updated.content = content;
    updated.excerpt = this.createExcerpt(content, 150);

    docs.set(documentId, updated);

    // Re-index the updated doc
    this.indexDocument(index, documentId, `${title}\n${content}`);

    // Touch stats
    if (s) {
      this.stats.set(projectId, {
        ...s,
        lastUpdate: Date.now(),
        indexSize: this.calculateIndexSize(index),
        totalDocuments: docs.size,
      });
    }
  }

  // ----------------- helpers -----------------

  private tokenize(text: string): string[] {
    return (text || '')
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((term) => term.length > 2)
      .slice(0, 32);
  }

  private indexDocument(index: Map<string, TermEntry>, docId: string, content: string): void {
    const terms = this.tokenize(content);

    terms.forEach((term, position) => {
      let entry = index.get(term);
      if (!entry) {
        entry = { term, documents: new Map<string, TermDocEntry>() };
        index.set(term, entry);
      }
      let docEntry = entry.documents.get(docId);
      if (!docEntry) {
        docEntry = { frequency: 0, positions: [] };
        entry.documents.set(docId, docEntry);
      }
      docEntry.frequency++;
      docEntry.positions.push(position);
    });
  }

  private createExcerpt(content: string, maxLength: number): string {
    const c = content ?? '';
    if (c.length <= maxLength) return c;
    return c.substring(0, Math.max(0, maxLength - 3)) + '...';
  }

  private highlightExcerpt(content: string, terms: string[]): string {
    const excerpt = this.createExcerpt(content ?? '', 300);
    if (!terms.length || !excerpt) return excerpt;

    const escaped = Array.from(
      new Set(terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))),
    ).filter(Boolean);

    if (!escaped.length) return excerpt;

    const regex = new RegExp(`\\b(${escaped.join('|')})\\b`, 'gi');
    return excerpt.replace(regex, (m) => `<mark>${m}</mark>`);
  }

  private getAverageDocumentLength(docs: Map<string, SearchResult>): number {
    const lengths = Array.from(docs.values()).map((d) => d.content.length || 0);
    if (!lengths.length) return 100;
    const sum = lengths.reduce((a, b) => a + b, 0);
    return sum / lengths.length || 100;
  }

  private calculateIndexSize(index: Map<string, TermEntry>): number {
    let size = 0;
    index.forEach((entry) => {
      size += entry.term.length * 2; // rough string bytes
      size += entry.documents.size * 24; // rough map overhead per doc entry
    });
    return size;
  }

  getStats(projectId: string): SearchStats | null {
    return this.stats.get(projectId) || null;
  }

  /** Percentiles + query count kept separate from SearchStats */
  getPerformanceMetrics(): { p50: number; p95: number; queries: number } {
    if (this.performanceSamplesMs.length === 0) return { p50: 0, p95: 0, queries: 0 };
    const sorted = [...this.performanceSamplesMs].sort((a, b) => a - b);
    const at = (p: number) =>
      sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))] ?? 0;
    return {
      p50: at(0.5),
      p95: at(0.95),
      queries: this.performanceSamplesMs.length,
    };
  }
}

// Enhanced search service with worker support
class EnhancedSearchService {
  private fallbackEngine = new MainThreadSearchEngine();
  private useWorker = true;
  private workerAvailable = false;

  constructor() {
    this.checkWorkerAvailability();
  }

  private checkWorkerAvailability(): void {
    try {
      // SSR-safe check
      this.workerAvailable =
        typeof window !== 'undefined' && typeof Worker !== 'undefined' && !!searchWorkerService;

      console.log(
        this.workerAvailable
          ? 'EnhancedSearchService: Web Worker support detected'
          : 'EnhancedSearchService: Web Worker not available, using main thread fallback',
      );
    } catch (error) {
      console.warn('EnhancedSearchService: Worker availability check failed:', error);
      this.workerAvailable = false;
    }
  }

  async initializeProject(projectId: string): Promise<void> {
    if (this.useWorker && this.workerAvailable) {
      try {
        const project = storageService.loadProject(projectId);
        const chapters = (await storageService.loadWritingChapters(projectId)) as Chapter[];

        if (!project) throw new Error(`Project ${projectId} not found`);

        const result = await searchWorkerService.initializeProject(projectId, project, chapters);
        if (!result?.success) {
          console.warn(
            'EnhancedSearchService: Worker initialization failed, falling back to main thread',
          );
          await this.fallbackEngine.initializeProject(projectId);
        }
      } catch (error) {
        console.warn('EnhancedSearchService: Worker failed, falling back to main thread:', error);
        await this.fallbackEngine.initializeProject(projectId);
      }
    } else {
      await this.fallbackEngine.initializeProject(projectId);
    }
  }

  async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    if (this.useWorker && this.workerAvailable) {
      try {
        const workerStatus = searchWorkerService.getWorkerStatus();
        if (workerStatus?.ready && options.projectId) {
          return await searchWorkerService.search(options.projectId, query, options);
        }
      } catch (error) {
        console.warn('EnhancedSearchService: Worker search failed, falling back:', error);
      }
    }
    return this.fallbackEngine.search(query, options);
  }

  async updateDocument(
    projectId: string,
    documentId: string,
    title: string,
    content: string,
  ): Promise<void> {
    if (this.useWorker && this.workerAvailable) {
      try {
        const success = await searchWorkerService.updateDocument(
          projectId,
          documentId,
          title,
          content,
        );
        if (success) return;
      } catch (error) {
        console.warn('EnhancedSearchService: Worker document update failed:', error);
      }
    }
    // Fallback: update the main-thread index immediately
    await this.fallbackEngine.updateDocument(projectId, documentId, title, content);
  }

  getStats(projectId: string): SearchStats | null {
    if (this.useWorker && this.workerAvailable) {
      const workerStatus = searchWorkerService.getWorkerStatus();
      if (workerStatus?.ready) {
        // If the worker maintained its own stats, we’d fetch them here and merge.
        const fallbackStats = this.fallbackEngine.getStats(projectId);
        if (fallbackStats) {
          const metrics = this.getPerformanceMetrics();
          return {
            ...fallbackStats,
            usingWorker: true,
            workerStatus,
            p50: metrics.p50,
            p95: metrics.p95,
            queries: metrics.queries,
          };
        }
        // If no fallback stats yet, still surface workerStatus.
        return {
          totalDocuments: 0,
          indexSize: 0,
          lastUpdate: Date.now(),
          queryCount: 0,
          averageLatency: 0,
          usingWorker: true,
          workerStatus,
        };
      }
    }
    const stats = this.fallbackEngine.getStats(projectId);
    if (!stats) return null;
    const metrics = this.getPerformanceMetrics();
    return {
      ...stats,
      usingWorker: false,
      p50: metrics.p50,
      p95: metrics.p95,
      queries: metrics.queries,
    };
  }

  getPerformanceMetrics(): { p50: number; p95: number; queries: number } {
    if (this.useWorker && this.workerAvailable) {
      const workerStatus = searchWorkerService.getWorkerStatus();
      if (workerStatus?.ready) {
        const metrics = searchWorkerService.getPerformanceMetrics();
        return {
          p50: metrics.p50,
          p95: metrics.p95,
          queries: metrics.queries,
        };
      }
    }
    return this.fallbackEngine.getPerformanceMetrics();
  }

  setWorkerPreference(useWorker: boolean): void {
    this.useWorker = useWorker;

    console.log(`EnhancedSearchService: Worker preference set to ${useWorker}`);
  }

  getWorkerStatus(): { available: boolean; enabled: boolean; status?: unknown } {
    return {
      available: this.workerAvailable,
      enabled: this.useWorker,
      status: this.workerAvailable ? searchWorkerService.getWorkerStatus() : undefined,
    };
  }
}

// Export singleton instance
export const enhancedSearchService = new EnhancedSearchService();

// Migration helper – allows drop-in replacement of existing searchService
export const searchService = enhancedSearchService;

// For debugging and development
declare global {
  interface Window {
    enhancedSearchService?: EnhancedSearchService;
    searchWorkerService?: typeof searchWorkerService;
    debugSearch?: {
      getWorkerStatus: () => ReturnType<EnhancedSearchService['getWorkerStatus']>;
      getPerformanceMetrics: () => ReturnType<EnhancedSearchService['getPerformanceMetrics']>;
      enableWorker: () => void;
      disableWorker: () => void;
      testSearch: (_query: string, _projectId: string) => Promise<SearchResult[]>;
    };
  }
}

if (typeof window !== 'undefined') {
  window.enhancedSearchService = enhancedSearchService;
  window.searchWorkerService = searchWorkerService;

  window.debugSearch = {
    getWorkerStatus: () => enhancedSearchService.getWorkerStatus(),
    getPerformanceMetrics: () => enhancedSearchService.getPerformanceMetrics(),
    enableWorker: () => enhancedSearchService.setWorkerPreference(true),
    disableWorker: () => enhancedSearchService.setWorkerPreference(false),
    testSearch: async (_query: string, _projectId: string) => {
      console.log('Testing search:', query);
      const start =
        typeof performance !== 'undefined' && 'now' in performance ? performance.now() : Date.now();
      const results = await enhancedSearchService.search(query, { projectId });
      const end =
        typeof performance !== 'undefined' && 'now' in performance ? performance.now() : Date.now();

      console.log(`Results: ${results.length} in ${(end - start).toFixed(1)}ms`);
      return results;
    },
  };

  console.log('Search debugging tools available at window.debugSearch');
}
