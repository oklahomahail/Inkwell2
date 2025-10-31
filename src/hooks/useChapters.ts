/**
 * useChapters Hook
 *
 * Simplified, focused hook for chapter management.
 * Re-exports useProjectChapters with a cleaner name for component use.
 *
 * Usage:
 * ```typescript
 * const { chapters, loading, createChapter, deleteChapter } = useChapters(projectId);
 * ```
 *
 * Features:
 * - Full CRUD operations
 * - Drag-and-drop reordering support
 * - Optimistic updates
 * - Loading and error states
 * - Automatic caching and refresh
 */

import type { Chapter } from '@/types/project';

import { useProjectChapters } from './useProject';

export interface UseChaptersResult {
  // Data
  chapters: Chapter[];
  chapterCount: number;
  totalWordCount: number;

  // State
  loading: boolean;
  error: string | null;

  // Operations
  refreshChapters: () => Promise<void>;
  getChapterById: (id: string) => Promise<Chapter | null>;
  saveChapter: (chapter: Chapter) => Promise<void>;
  createChapter: (title: string, options?: Partial<Chapter>) => Promise<Chapter>;
  updateContent: (chapterId: string, content: string, wordCount?: number) => Promise<void>;
  deleteChapter: (chapterId: string) => Promise<void>;
  reorderChapters: (chapterIds: string[]) => Promise<void>;
}

/**
 * Hook for managing chapters
 *
 * @param projectId - Current project ID (null if no project selected)
 * @returns Chapter management interface
 */
export function useChapters(projectId: string | null): UseChaptersResult {
  return useProjectChapters(projectId);
}

/**
 * Type-safe chapter helpers
 */
export const ChapterHelpers = {
  /**
   * Sort chapters by order field
   */
  sortByOrder(chapters: Chapter[]): Chapter[] {
    return [...chapters].sort((a, b) => a.order - b.order);
  },

  /**
   * Find chapter by ID
   */
  findById(chapters: Chapter[], id: string): Chapter | undefined {
    return chapters.find((c) => c.id === id);
  },

  /**
   * Get next chapter in sequence
   */
  getNext(chapters: Chapter[], currentId: string): Chapter | null {
    const sorted = this.sortByOrder(chapters);
    const currentIndex = sorted.findIndex((c) => c.id === currentId);
    return sorted[currentIndex + 1] || null;
  },

  /**
   * Get previous chapter in sequence
   */
  getPrevious(chapters: Chapter[], currentId: string): Chapter | null {
    const sorted = this.sortByOrder(chapters);
    const currentIndex = sorted.findIndex((c) => c.id === currentId);
    return sorted[currentIndex - 1] || null;
  },

  /**
   * Calculate total word count
   */
  getTotalWords(chapters: Chapter[]): number {
    return chapters.reduce((sum, chapter) => sum + chapter.wordCount, 0);
  },

  /**
   * Get chapters by status
   */
  filterByStatus(chapters: Chapter[], status: Chapter['status']): Chapter[] {
    return chapters.filter((c) => c.status === status);
  },

  /**
   * Calculate progress percentage
   */
  getProgressPercentage(chapters: Chapter[]): number {
    if (chapters.length === 0) return 0;
    const completed = this.filterByStatus(chapters, 'completed').length;
    return Math.round((completed / chapters.length) * 100);
  },
};
