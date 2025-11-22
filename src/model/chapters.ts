/**
 * Chapter Model Gateway
 *
 * Unified API for chapter operations that routes to the correct implementation
 * based on VITE_ENABLE_CHAPTER_MODEL feature flag.
 *
 * When flag is ON:  Uses chaptersService (IndexedDB, split meta/doc)
 * When flag is OFF: Uses storageService (localStorage, scene-based)
 *
 * This abstraction allows components to work with canonical Chapter type
 * regardless of underlying storage mechanism.
 */

import {
  sceneChapterToCanonical,
  convertLegacyChapters,
  canonicalToLegacyChapter,
  isLegacyChapterFormat,
} from '@/adapters';
import { markSceneMetadataStale } from '@/services/ai/sceneClassificationService';
import { chapterCache, CacheKeys, withChapterListCache } from '@/services/chapterCache';
import type { Chapter } from '@/types/project';
import { FEATURE_FLAGS } from '@/utils/featureFlags.config';
import { trackChapterQuery } from '@/utils/perf';

// Lazy imports to avoid circular dependencies
let chaptersService: any = null;
let storageService: any = null;

async function getChaptersService() {
  if (!chaptersService) {
    const module = await import('@/services/chaptersService');
    chaptersService = module.Chapters;
  }
  return chaptersService;
}

async function getStorageService() {
  if (!storageService) {
    const module = await import('@/services/storageService');
    storageService = module.EnhancedStorageService;
  }
  return storageService;
}

/**
 * Feature flag check - centralized for testing
 */
export function isChapterModelEnabled(): boolean {
  return FEATURE_FLAGS.CHAPTER_MODEL?.defaultValue ?? false;
}

/**
 * Get all chapters for a project
 * Returns canonical Chapter[] regardless of storage format
 */
export async function getChapters(projectId: string): Promise<Chapter[]> {
  return trackChapterQuery('getChapters', async () => {
    if (isChapterModelEnabled()) {
      // New model: Use chaptersService (IndexedDB) with cache
      const service = await getChaptersService();

      // Use cache wrapper for chapterMetas list
      const chapterMetas = await withChapterListCache(projectId, () => service.list(projectId));

      // Load full chapters (meta + content)
      const chapters: Chapter[] = [];
      for (const meta of chapterMetas) {
        const fullChapter = await service.get(meta.id);
        chapters.push({
          id: fullChapter.id,
          title: fullChapter.title,
          summary: fullChapter.summary,
          content: fullChapter.content,
          wordCount: fullChapter.wordCount,
          targetWordCount: undefined,
          status: mapChapterStatus(fullChapter.status),
          order: fullChapter.index,
          charactersInChapter: [],
          plotPointsResolved: [],
          notes: '',
          createdAt: new Date(fullChapter.createdAt).getTime(),
          updatedAt: new Date(fullChapter.updatedAt).getTime(),
        });
      }
      return chapters;
    } else {
      // Legacy model: Use storageService (localStorage) and convert
      const storage = await getStorageService();
      const legacyChapters = (await storage.getChapters?.(projectId)) || [];

      // Convert legacy scene-based chapters to canonical format
      if (legacyChapters.length > 0 && isLegacyChapterFormat(legacyChapters[0])) {
        return convertLegacyChapters(legacyChapters);
      }

      return legacyChapters;
    }
  });
}

/**
 * Get a single chapter by ID
 */
export async function getChapter(chapterId: string): Promise<Chapter | null> {
  return trackChapterQuery('getChapter', async () => {
    if (isChapterModelEnabled()) {
      // New model
      const service = await getChaptersService();
      try {
        const fullChapter = await service.get(chapterId);
        return {
          id: fullChapter.id,
          title: fullChapter.title,
          summary: fullChapter.summary,
          content: fullChapter.content,
          wordCount: fullChapter.wordCount,
          targetWordCount: undefined,
          status: mapChapterStatus(fullChapter.status),
          order: fullChapter.index,
          charactersInChapter: [],
          plotPointsResolved: [],
          notes: '',
          createdAt: new Date(fullChapter.createdAt).getTime(),
          updatedAt: new Date(fullChapter.updatedAt).getTime(),
        };
      } catch (error) {
        console.error('Failed to get chapter:', error);
        return null;
      }
    } else {
      // Legacy model
      const storage = await getStorageService();
      const legacyChapter = await storage.getChapter?.(chapterId);

      if (!legacyChapter) return null;

      if (isLegacyChapterFormat(legacyChapter)) {
        return sceneChapterToCanonical(legacyChapter);
      }

      return legacyChapter;
    }
  });
}

/**
 * Save a chapter (create or update)
 */
export async function saveChapter(projectId: string, chapter: Chapter): Promise<Chapter> {
  if (isChapterModelEnabled()) {
    // New model: Save to IndexedDB
    const service = await getChaptersService();

    // Check if chapter exists
    const existing = await service.getMeta(chapter.id);

    if (existing) {
      // Update existing chapter
      await service.updateMeta({
        id: chapter.id,
        title: chapter.title,
        summary: chapter.summary,
        status: mapToChapterMetaStatus(chapter.status),
        tags: [],
      });

      await service.saveDoc(chapter.id, {
        content: chapter.content,
        wordCount: chapter.wordCount,
      });
    } else {
      // Create new chapter
      await service.create({
        id: chapter.id,
        projectId,
        title: chapter.title,
        summary: chapter.summary,
        content: chapter.content,
        index: chapter.order,
        status: mapToChapterMetaStatus(chapter.status),
      });
    }

    // Invalidate cache for this project and chapter
    chapterCache.invalidate([CacheKeys.chapterList(projectId), CacheKeys.chapterMeta(chapter.id)]);

    return chapter;
  } else {
    // Legacy model: Save to localStorage
    const storage = await getStorageService();

    // Convert canonical chapter to legacy format if needed
    const legacyChapter = canonicalToLegacyChapter(chapter);

    await storage.saveChapter?.(projectId, legacyChapter);

    return chapter;
  }
}

/**
 * Create a new chapter
 */
export async function createChapter(
  projectId: string,
  title: string,
  options: Partial<Chapter> = {},
): Promise<Chapter> {
  const now = Date.now();
  const id = options.id || `chapter-${now}-${Math.random().toString(36).substr(2, 9)}`;

  const chapter: Chapter = {
    id,
    title,
    summary: options.summary || '',
    content: options.content || '',
    wordCount: options.wordCount || 0,
    targetWordCount: options.targetWordCount,
    status: options.status || 'in-progress',
    order: options.order ?? 0,
    charactersInChapter: options.charactersInChapter || [],
    plotPointsResolved: options.plotPointsResolved || [],
    notes: options.notes || '',
    createdAt: now,
    updatedAt: now,
  };

  return saveChapter(projectId, chapter);
}

/**
 * Update chapter content (common operation during writing)
 */
export async function updateChapterContent(
  projectId: string,
  chapterId: string,
  content: string,
  wordCount?: number,
): Promise<void> {
  if (isChapterModelEnabled()) {
    // New model: Direct content update
    const service = await getChaptersService();
    await service.saveDoc(chapterId, {
      content,
      wordCount: wordCount ?? countWords(content),
    });

    // Update meta wordCount
    const meta = await service.getMeta(chapterId);
    if (meta) {
      await service.updateMeta({
        ...meta,
        wordCount: wordCount ?? countWords(content),
      });
    }

    // Invalidate cache
    chapterCache.invalidate([CacheKeys.chapterList(projectId), CacheKeys.chapterMeta(chapterId)]);

    // Mark scene metadata as stale (Phase 4: Auto-sync)
    // This is fire-and-forget - don't await to avoid slowing down saves
    markSceneMetadataStale(chapterId).catch(() => {
      // Silently fail - non-critical operation
    });
  } else {
    // Legacy model: Load, modify, save
    const chapter = await getChapter(chapterId);
    if (chapter) {
      chapter.content = content;
      chapter.wordCount = wordCount ?? countWords(content);
      chapter.updatedAt = Date.now();
      await saveChapter(projectId, chapter);

      // Mark scene metadata as stale (Phase 4: Auto-sync)
      markSceneMetadataStale(chapterId).catch(() => {
        // Silently fail - non-critical operation
      });
    }
  }
}

/**
 * Delete a chapter
 */
export async function deleteChapter(projectId: string, chapterId: string): Promise<void> {
  if (isChapterModelEnabled()) {
    // New model
    const service = await getChaptersService();
    await service.remove(chapterId);

    // Invalidate cache
    chapterCache.invalidate([CacheKeys.chapterList(projectId), CacheKeys.chapterMeta(chapterId)]);
  } else {
    // Legacy model
    const storage = await getStorageService();
    await storage.deleteChapter?.(projectId, chapterId);
  }
}

/**
 * Reorder chapters
 */
export async function reorderChapters(projectId: string, chapterIds: string[]): Promise<void> {
  if (isChapterModelEnabled()) {
    // New model
    const service = await getChaptersService();
    await service.reorder(projectId, chapterIds);

    // Invalidate entire project cache (all chapter metadata affected)
    chapterCache.invalidateProject(projectId);
  } else {
    // Legacy model: Load all, update order, save
    const chapters = await getChapters(projectId);
    const reordered = chapterIds
      .map((id, index) => {
        const chapter = chapters.find((c) => c.id === id);
        if (chapter) {
          chapter.order = index;
        }
        return chapter;
      })
      .filter(Boolean) as Chapter[];

    for (const chapter of reordered) {
      await saveChapter(projectId, chapter);
    }
  }
}

/**
 * Get chapter count for a project (lightweight)
 */
export async function getChapterCount(projectId: string): Promise<number> {
  if (isChapterModelEnabled()) {
    // New model: Just count metas (fast)
    const service = await getChaptersService();
    const metas = await service.list(projectId);
    return metas.length;
  } else {
    // Legacy model: Load and count
    const chapters = await getChapters(projectId);
    return chapters.length;
  }
}

/**
 * Get total word count across all chapters
 */
export async function getTotalWordCount(projectId: string): Promise<number> {
  if (isChapterModelEnabled()) {
    // New model: Sum from metas (no need to load content)
    const service = await getChaptersService();
    const metas = await service.list(projectId);
    return metas.reduce((sum: number, meta: any) => sum + meta.wordCount, 0);
  } else {
    // Legacy model: Load chapters and sum
    const chapters = await getChapters(projectId);
    return chapters.reduce((sum: number, chapter: Chapter) => sum + chapter.wordCount, 0);
  }
}

// ============================================
// Helper Functions
// ============================================

/**
 * Map ChapterMeta status to canonical ChapterStatus
 */
function mapChapterStatus(status: 'draft' | 'revising' | 'final'): Chapter['status'] {
  const statusMap: Record<string, Chapter['status']> = {
    draft: 'first-draft',
    revising: 'revised',
    final: 'completed',
  };
  return statusMap[status] || 'in-progress';
}

/**
 * Map canonical ChapterStatus to ChapterMeta status
 */
function mapToChapterMetaStatus(status: Chapter['status']): 'draft' | 'revising' | 'final' {
  const statusMap: Record<Chapter['status'], 'draft' | 'revising' | 'final'> = {
    planned: 'draft',
    'in-progress': 'draft',
    'first-draft': 'draft',
    revised: 'revising',
    completed: 'final',
  };
  return statusMap[status] || 'draft';
}

/**
 * Count words in content (basic implementation)
 */
function countWords(content: string): number {
  return content
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
}

/**
 * Export all gateway functions for easy testing
 */
export const ChapterGateway = {
  getChapters,
  getChapter,
  saveChapter,
  createChapter,
  updateChapterContent,
  deleteChapter,
  reorderChapters,
  getChapterCount,
  getTotalWordCount,
  isChapterModelEnabled,
};
