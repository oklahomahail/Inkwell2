// @ts-nocheck
// src/services/searchService.ts
import devLog from "src/utils/devLogger";

import type { Scene } from '@/types/writing';

import { storageService } from './storageService';

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
}

interface IndexEntry {
  term: string;
  documents: Map<
    string,
    {
      frequency: number;
      positions: number[];
    }
  >;
}

class SearchService {
  private indexes = new Map<string, Map<string, IndexEntry>>();
  private documents = new Map<string, Map<string, SearchResult>>();
  private stats = new Map<string, SearchStats>();
  private queryHistory: string[] = [];
  private performanceMetrics: number[] = [];

  // Initialize search service for a project
  async initializeProject(projectId: string): Promise<void> {
    if (this.indexes.has(projectId)) {
      return; // Already initialized
    }

    devLog.debug(`Initializing search index for project ${projectId}`);

    const startTime = Date.now();
    const index = new Map<string, IndexEntry>();
    const documents = new Map<string, SearchResult>();

    try {
      // Load project data
      const project = storageService.loadProject(projectId);
      const chapters = await storageService.loadWritingChapters(projectId);

      if (!project) {
        throw new Error(`Project ${projectId} not found`);
      }

      let totalDocuments = 0;

      // Index chapters
      chapters.forEach((chapter) => {
        const result: SearchResult = {
          id: chapter.id,
          type: 'chapter',
          title: chapter.title,
          content: chapter.scenes.map((s: Scene) => s.content).join('\n\n'),
          excerpt: this.createExcerpt(chapter.title, 150),
          score: 0,
          projectId,
          metadata: {
            wordCount: chapter.totalWordCount,
            status: chapter.status,
            lastModified: chapter.updatedAt,
          },
        };

        documents.set(chapter.id, result);
        this.indexDocument(index, chapter.id, chapter.title + '\n' + result.content);
        totalDocuments++;

        // Index individual scenes
        chapter.scenes.forEach((scene) => {
          const sceneResult: SearchResult = {
            id: scene.id,
            type: 'scene',
            title: scene.title,
            content: scene.content,
            excerpt: this.createExcerpt(scene.content, 150),
            score: 0,
            projectId,
            chapterId: chapter.id,
            metadata: {
              wordCount: scene.wordCount,
              status: scene.status,
              lastModified: scene.updatedAt,
            },
          };

          documents.set(scene.id, sceneResult);
          this.indexDocument(index, scene.id, scene.title + '\n' + scene.content);
          totalDocuments++;
        });
      });

      // Index characters if available
      if ((project as any).characters) {
        (project as any).characters.forEach((character: any) => {
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

      // Update stats
      const indexTime = Date.now() - startTime;
      this.stats.set(projectId, {
        totalDocuments,
        indexSize: this.calculateIndexSize(index),
        lastUpdate: Date.now(),
        queryCount: 0,
        averageLatency: 0,
      });

      devLog.debug(
        `Search index built for project ${projectId}: ${totalDocuments} documents in ${indexTime}ms`,
      );
    } catch (error) {
      console.error(`Failed to initialize search for project ${projectId}:`, error);
      throw error;
    }
  }

  // Search across project content
  async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    const startTime = Date.now();
    const {
      types = ['scene', 'chapter', 'character', 'plot'],
      maxResults = 20,
      minScore = 0.001,
      projectId,
    } = options;

    if (!projectId) {
      throw new Error('Project ID is required for search');
    }

    try {
      // Ensure project is indexed
      await this.initializeProject(projectId);

      const index = this.indexes.get(projectId);
      const documents = this.documents.get(projectId);

      if (!index || !documents) {
        return [];
      }

      // Parse and normalize query
      const terms = this.tokenize(query.toLowerCase());
      if (terms.length === 0) {
        return [];
      }

      // Calculate scores using BM25
      const scores = new Map<string, number>();
      const docCount = documents.size;

      terms.forEach((term) => {
        const entry = index.get(term);
        if (!entry) return;

        const idf = Math.max(
          0.001,
          Math.log((docCount - entry.documents.size + 0.5) / (entry.documents.size + 0.5)),
        );

        entry.documents.forEach((termDoc, docId) => {
          if (!documents.has(docId)) return;

          const doc = documents.get(docId)!;

          // Filter by type
          if (!types.includes(doc.type)) return;

          // BM25 parameters
          const k1 = 1.5;
          const b = 0.75;
          const avgdl = this.getAverageDocumentLength(documents);
          const docLength = doc.content.length;

          const tf = termDoc.frequency;
          const score = (idf * (tf * (k1 + 1))) / (tf + k1 * (1 - b + b * (docLength / avgdl)));

          scores.set(docId, (scores.get(docId) || 0) + score);
        });
      });

      // Prepare results
      const results: SearchResult[] = Array.from(scores.entries())
        .filter(([, score]) => score >= minScore)
        .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
        .slice(0, maxResults)
        .map(([docId, score]) => {
          const doc = documents.get(docId)!;
          return {
            ...doc,
            score,
            excerpt: this.highlightExcerpt(doc.content, terms),
          };
        });

      // Update metrics
      const latency = Date.now() - startTime;
      this.performanceMetrics.push(latency);
      this.queryHistory.push(query);

      // Keep only last 100 queries and metrics
      if (this.queryHistory.length > 100) {
        this.queryHistory = this.queryHistory.slice(-100);
        this.performanceMetrics = this.performanceMetrics.slice(-100);
      }

      // Update stats
      const stats = this.stats.get(projectId)!;
      stats.queryCount++;
      stats.averageLatency =
        this.performanceMetrics.reduce((sum, metric) => sum + metric, 0) /
        this.performanceMetrics.length;

      devLog.debug(`Search completed: "${query}" -> ${results.length} results in ${latency}ms`);

      return results;
    } catch (error) {
      console.error('Search failed:', error);
      return [];
    }
  }

  // Update document in search index
  async updateDocument(
    projectId: string,
    documentId: string,
    title: string,
    content: string,
  ): Promise<void> {
    await this.initializeProject(projectId);

    const index = this.indexes.get(projectId);
    const documents = this.documents.get(projectId);

    if (!index || !documents) {
      console.warn(`No index found for project ${projectId}`);
      return;
    }

    // Remove old document from index
    this.removeDocumentFromIndex(index, documentId);

    // Re-index with new content
    this.indexDocument(index, documentId, title + '\n' + content);

    // Update document store if it exists
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

    devLog.debug(`Updated document ${documentId} in search index`);
  }

  // Get search statistics
  getStats(projectId: string): SearchStats | null {
    return this.stats.get(projectId) || null;
  }

  // Get performance metrics
  getPerformanceMetrics(): { p50: number; p95: number; queries: number } {
    if (this.performanceMetrics.length === 0) {
      return { p50: 0, p95: 0, queries: 0 };
    }

    const sorted = [...this.performanceMetrics].sort((a, b) => a - b);
    const p50Index = Math.floor(sorted.length * 0.5);
    const p95Index = Math.floor(sorted.length * 0.95);

    return {
      p50: sorted[p50Index] || 0,
      p95: sorted[p95Index] || 0,
      queries: this.performanceMetrics.length,
    };
  }

  // Private helper methods
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((term) => term.length > 2)
      .slice(0, 20);
  }

  private indexDocument(index: Map<string, IndexEntry>, docId: string, content: string): void {
    const terms = this.tokenize(content);
    const termCounts = new Map<string, number>();

    // Count term frequencies and positions
    terms.forEach((term, position) => {
      termCounts.set(term, (termCounts.get(term) || 0) + 1);

      if (!index.has(term)) {
        index.set(term, {
          term,
          documents: new Map(),
        });
      }

      const entry = index.get(term)!;
      if (!entry.documents.has(docId)) {
        entry.documents.set(docId, {
          frequency: 0,
          positions: [],
        });
      }

      const docEntry = entry.documents.get(docId)!;
      docEntry.frequency++;
      docEntry.positions.push(position);
    });
  }

  private removeDocumentFromIndex(index: Map<string, IndexEntry>, docId: string): void {
    index.forEach((entry) => {
      entry.documents.delete(docId);
      if (entry.documents.size === 0) {
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
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      excerpt = excerpt.replace(regex, `<mark>$&</mark>`);
    });

    return excerpt;
  }

  private getAverageDocumentLength(documents: Map<string, SearchResult>): number {
    const lengths = Array.from(documents.values()).map((doc) => doc.content.length);
    return lengths.reduce((sum, len) => sum + len, 0) / lengths.length;
  }

  private calculateIndexSize(index: Map<string, IndexEntry>): number {
    let size = 0;
    index.forEach((entry) => {
      size += entry.term.length * 2; // Approximate character size
      size += entry.documents.size * 16; // Approximate document entry size
    });
    return size;
  }
}

// Export singleton instance
export const searchService = new SearchService();
