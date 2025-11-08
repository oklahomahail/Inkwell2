// src/services/chaptersService.ts
/**
 * Chapter Management Service
 *
 * Handles chapter CRUD operations with split meta/doc storage:
 * - ChapterMeta: Lightweight metadata for lists, analytics
 * - ChapterDoc: Heavy content stored separately
 *
 * Storage: IndexedDB (local-first) with future Supabase sync capability
 */

import { v4 as uuidv4 } from 'uuid';

import type {
  ChapterMeta,
  ChapterDoc,
  FullChapter,
  CreateChapterInput,
  UpdateChapterInput,
} from '@/types/writing';

import { chapterCache, CacheKeys } from './chapterCache';

// IndexedDB configuration
const DB_NAME = 'inkwell_chapters';
const DB_VERSION = 1;
const META_STORE = 'chapter_meta';
const DOC_STORE = 'chapter_docs';

class ChaptersService {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize IndexedDB
   */
  private async init(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Chapter metadata store
        if (!db.objectStoreNames.contains(META_STORE)) {
          const metaStore = db.createObjectStore(META_STORE, { keyPath: 'id' });
          metaStore.createIndex('projectId', 'projectId', { unique: false });
          metaStore.createIndex('projectId_index', ['projectId', 'index'], { unique: false });
        }

        // Chapter document store
        if (!db.objectStoreNames.contains(DOC_STORE)) {
          db.createObjectStore(DOC_STORE, { keyPath: 'id' });
        }
      };
    });

    return this.initPromise;
  }

  /**
   * Get database instance (ensures init)
   */
  private async getDB(): Promise<IDBDatabase> {
    await this.init();
    if (!this.db) throw new Error('Failed to initialize database');
    return this.db;
  }

  /**
   * List all chapters for a project (sorted by index)
   */
  async list(projectId: string): Promise<ChapterMeta[]> {
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(META_STORE, 'readonly');
      const store = tx.objectStore(META_STORE);
      const index = store.index('projectId');
      const request = index.getAll(projectId);

      request.onsuccess = () => {
        const chapters = (request.result as ChapterMeta[]).sort((a, b) => a.index - b.index);
        resolve(chapters);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get full chapter (meta + doc)
   */
  async get(id: string): Promise<FullChapter> {
    const db = await this.getDB();

    const meta = await new Promise<ChapterMeta>((resolve, reject) => {
      const tx = db.transaction(META_STORE, 'readonly');
      const request = tx.objectStore(META_STORE).get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    if (!meta) throw new Error(`Chapter ${id} not found`);

    const doc = await new Promise<ChapterDoc>((resolve, reject) => {
      const tx = db.transaction(DOC_STORE, 'readonly');
      const request = tx.objectStore(DOC_STORE).get(id);
      request.onsuccess = () => resolve(request.result || { id, content: '', version: 1 });
      request.onerror = () => reject(request.error);
    });

    return {
      ...meta,
      content: doc.content,
      version: doc.version,
      scenes: doc.scenes,
    };
  }

  /**
   * Get chapter metadata only (fast)
   */
  async getMeta(id: string): Promise<ChapterMeta | null> {
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(META_STORE, 'readonly');
      const request = tx.objectStore(META_STORE).get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Create a new chapter
   */
  async create(input: CreateChapterInput): Promise<ChapterMeta> {
    const db = await this.getDB();

    // Get current max index for this project
    const existing = await this.list(input.projectId);
    const maxIndex = existing.length > 0 ? Math.max(...existing.map((c) => c.index)) : -1;
    const index = input.index ?? maxIndex + 1;

    const now = new Date().toISOString();
    // Use provided ID (if already exists from sync) or generate a UUID for Supabase compatibility
    const id = input.id || uuidv4();

    const meta: ChapterMeta = {
      id,
      projectId: input.projectId,
      title: input.title || `Chapter ${index + 1}`,
      index,
      summary: input.summary,
      status: input.status || 'draft',
      wordCount: 0,
      sceneCount: 0,
      tags: [],
      createdAt: now,
      updatedAt: now,
    };

    // Save metadata
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(META_STORE, 'readwrite');
      const request = tx.objectStore(META_STORE).add(meta);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    // Create empty document
    const doc: ChapterDoc = {
      id,
      content: input.content || '',
      version: 1,
      scenes: [],
    };

    await this.saveDoc(doc);

    return meta;
  }

  /**
   * Update chapter metadata
   */
  async updateMeta(input: UpdateChapterInput): Promise<void> {
    const db = await this.getDB();

    const meta = await this.getMeta(input.id);
    if (!meta) throw new Error(`Chapter ${input.id} not found`);

    const updated: ChapterMeta = {
      ...meta,
      title: input.title ?? meta.title,
      summary: input.summary ?? meta.summary,
      status: input.status ?? meta.status,
      tags: input.tags ?? meta.tags,
      wordCount: input.wordCount ?? meta.wordCount,
      updatedAt: new Date().toISOString(),
    };

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(META_STORE, 'readwrite');
      const request = tx.objectStore(META_STORE).put(updated);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    // Invalidate cache
    chapterCache.invalidate([
      CacheKeys.chapterList(meta.projectId),
      CacheKeys.chapterMeta(input.id),
    ]);
  }

  /**
   * Update chapter word count (called by editor)
   */
  async updateWordCount(id: string, wordCount: number): Promise<void> {
    const db = await this.getDB();
    const meta = await this.getMeta(id);
    if (!meta) return;

    meta.wordCount = wordCount;
    meta.updatedAt = new Date().toISOString();

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(META_STORE, 'readwrite');
      const request = tx.objectStore(META_STORE).put(meta);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    // Invalidate cache
    chapterCache.invalidate([CacheKeys.chapterList(meta.projectId), CacheKeys.chapterMeta(id)]);
  }

  /**
   * Save chapter document (content)
   */
  async saveDoc(doc: ChapterDoc): Promise<void> {
    const db = await this.getDB();

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(DOC_STORE, 'readwrite');
      const request = tx.objectStore(DOC_STORE).put(doc);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    // Invalidate doc cache (note: we need to fetch meta to get projectId)
    const meta = await this.getMeta(doc.id);
    if (meta) {
      chapterCache.invalidate([
        CacheKeys.chapterList(meta.projectId),
        CacheKeys.chapterDoc(doc.id),
      ]);
    }
  }

  /**
   * Reorder chapters (updates index for all chapters)
   */
  async reorder(projectId: string, orderedIds: string[]): Promise<void> {
    const db = await this.getDB();
    const tx = db.transaction(META_STORE, 'readwrite');
    const store = tx.objectStore(META_STORE);

    const promises = orderedIds.map(async (id, newIndex) => {
      const meta = await new Promise<ChapterMeta>((resolve, reject) => {
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });

      if (meta && meta.projectId === projectId) {
        meta.index = newIndex;
        meta.updatedAt = new Date().toISOString();
        await new Promise<void>((resolve, reject) => {
          const req = store.put(meta);
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
        });
      }
    });

    await Promise.all(promises);

    // Invalidate all chapter caches for this project
    chapterCache.invalidateProject(projectId);
  }

  /**
   * Delete a chapter (both meta and doc)
   */
  async remove(id: string): Promise<void> {
    const db = await this.getDB();

    // Get meta first to know projectId for cache invalidation
    const meta = await this.getMeta(id);

    // Delete metadata
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(META_STORE, 'readwrite');
      const request = tx.objectStore(META_STORE).delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    // Delete document
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(DOC_STORE, 'readwrite');
      const request = tx.objectStore(DOC_STORE).delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    // Invalidate cache
    if (meta) {
      chapterCache.invalidate([
        CacheKeys.chapterList(meta.projectId),
        CacheKeys.chapterMeta(id),
        CacheKeys.chapterDoc(id),
      ]);
    }
  }

  /**
   * Duplicate a chapter
   */
  async duplicate(id: string): Promise<ChapterMeta> {
    const original = await this.get(id);

    const newChapter = await this.create({
      projectId: original.projectId,
      title: `${original.title} (Copy)`,
      summary: original.summary,
      content: original.content,
      status: 'draft',
    });

    return newChapter;
  }

  /**
   * Split chapter at cursor position
   */
  async split(
    id: string,
    splitPoint: number,
    newTitle?: string,
  ): Promise<{ first: ChapterMeta; second: ChapterMeta }> {
    const original = await this.get(id);

    const firstContent = original.content.substring(0, splitPoint);
    const secondContent = original.content.substring(splitPoint);

    // Update original chapter with first half
    const firstDoc: ChapterDoc = {
      id: original.id,
      content: firstContent,
      version: original.version + 1,
    };
    await this.saveDoc(firstDoc);

    // Count words in first half
    const firstWordCount = this.countWords(firstContent);
    await this.updateWordCount(original.id, firstWordCount);

    // Create new chapter with second half
    const secondMeta = await this.create({
      projectId: original.projectId,
      title: newTitle || `${original.title} (Part 2)`,
      content: secondContent,
      status: 'draft',
    });

    // Update word count for second chapter
    const secondWordCount = this.countWords(secondContent);
    await this.updateWordCount(secondMeta.id, secondWordCount);

    // Reorder to place new chapter after original
    const allChapters = await this.list(original.projectId);
    const newOrder = allChapters
      .filter((c) => c.id !== secondMeta.id)
      .flatMap((c) => (c.id === original.id ? [original.id, secondMeta.id] : [c.id]));

    await this.reorder(original.projectId, newOrder);

    return {
      first: (await this.getMeta(original.id)) as ChapterMeta,
      second: secondMeta,
    };
  }

  /**
   * Merge chapter with next chapter
   */
  async mergeWithNext(id: string): Promise<ChapterMeta> {
    const meta = await this.getMeta(id);
    if (!meta) throw new Error('Chapter not found');

    const chapters = await this.list(meta.projectId);
    const currentIndex = chapters.findIndex((c) => c.id === id);

    if (currentIndex === -1 || currentIndex === chapters.length - 1) {
      throw new Error('Cannot merge: chapter not found or is last chapter');
    }

    const current = await this.get(id);
    const nextChapter = chapters[currentIndex + 1];
    if (!nextChapter) throw new Error('Next chapter not found');

    const next = await this.get(nextChapter.id);

    // Combine content
    const mergedContent = `${current.content}\n\n${next.content}`;
    const mergedWordCount = this.countWords(mergedContent);

    // Update current chapter
    await this.saveDoc({
      id: current.id,
      content: mergedContent,
      version: current.version + 1,
    });
    await this.updateWordCount(current.id, mergedWordCount);

    // Delete next chapter
    await this.remove(next.id);

    return (await this.getMeta(current.id))!;
  }

  /**
   * Count words in content
   */
  private countWords(content: string): number {
    // Strip HTML tags
    const text = content.replace(/<[^>]*>/g, ' ');
    // Count words
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  }

  /**
   * Import chapters from existing document (split by headings)
   */
  async importFromDocument(
    projectId: string,
    content: string,
    options?: {
      headingPattern?: RegExp;
      preserveOriginal?: boolean;
    },
  ): Promise<ChapterMeta[]> {
    const pattern =
      options?.headingPattern || /^(#{1,2})\s+(Chapter|Prologue|Epilogue|Part)\s+(.+)$/gim;

    const splits: Array<{ title: string; content: string }> = [];
    const lines = content.split('\n');
    let currentChapter: { title: string; content: string[] } | null = null;

    for (const line of lines) {
      const match = pattern.exec(line);
      if (match && match[3]) {
        // Save previous chapter
        if (currentChapter) {
          splits.push({
            title: currentChapter.title,
            content: currentChapter.content.join('\n'),
          });
        }
        // Start new chapter
        currentChapter = {
          title: match[3].trim(),
          content: [],
        };
      } else if (currentChapter) {
        currentChapter.content.push(line);
      }
    }

    // Save last chapter
    if (currentChapter) {
      splits.push({
        title: currentChapter.title,
        content: currentChapter.content.join('\n'),
      });
    }

    // If no splits found, create single chapter
    if (splits.length === 0) {
      splits.push({
        title: 'Chapter 1',
        content,
      });
    }

    // Create chapters
    const created: ChapterMeta[] = [];
    for (let i = 0; i < splits.length; i++) {
      const split = splits[i];
      if (!split) continue;

      const chapter = await this.create({
        projectId,
        title: split.title,
        content: split.content,
        index: i,
        status: 'draft',
      });

      // Update word count
      const wordCount = this.countWords(split.content);
      await this.updateWordCount(chapter.id, wordCount);

      created.push(chapter);
    }

    return created;
  }

  /**
   * Get chapter count for a project
   */
  async getCount(projectId: string): Promise<number> {
    const chapters = await this.list(projectId);
    return chapters.length;
  }

  /**
   * Get total word count for a project
   */
  async getTotalWordCount(projectId: string): Promise<number> {
    const chapters = await this.list(projectId);
    return chapters.reduce((sum, chapter) => sum + chapter.wordCount, 0);
  }

  /**
   * Export chapters for a project (in order)
   */
  async exportChapters(projectId: string): Promise<FullChapter[]> {
    const metas = await this.list(projectId);
    const chapters = await Promise.all(metas.map((m) => this.get(m.id)));
    return chapters;
  }
}

// Export singleton instance
export const Chapters = new ChaptersService();
export default Chapters;
