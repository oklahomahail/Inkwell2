/**
 * useChapterDragAndDrop Hook
 *
 * Provides drag-and-drop reordering functionality for chapters.
 * Works with @dnd-kit or react-beautiful-dnd libraries.
 *
 * Usage:
 * ```typescript
 * const { reorder, isReordering } = useChapterDragAndDrop(projectId, chapters, onReorder);
 *
 * // In drag handler
 * await reorder(startIndex, endIndex);
 * ```
 */

import { useState, useCallback } from 'react';

import { reorderChapters as reorderChaptersGateway } from '@/model';
import type { Chapter } from '@/types/project';

export interface UseChapterDragAndDropResult {
  /**
   * Reorder chapters by moving from startIndex to endIndex
   */
  reorder: (startIndex: number, endIndex: number) => Promise<void>;

  /**
   * Reorder chapters using explicit ID array
   */
  reorderByIds: (chapterIds: string[]) => Promise<void>;

  /**
   * Whether a reorder operation is in progress
   */
  isReordering: boolean;

  /**
   * Error from last reorder operation
   */
  error: string | null;
}

export interface UseChapterDragAndDropOptions {
  /**
   * Called after successful reorder (before gateway call)
   */
  onReorderStart?: (chapters: Chapter[]) => void;

  /**
   * Called after successful reorder (after gateway call)
   */
  onReorderSuccess?: (chapters: Chapter[]) => void;

  /**
   * Called if reorder fails
   */
  onReorderError?: (error: Error) => void;

  /**
   * Enable optimistic updates (update UI before server confirmation)
   */
  optimistic?: boolean;
}

/**
 * Hook for chapter drag-and-drop reordering
 *
 * @param projectId - Current project ID
 * @param chapters - Current chapters array
 * @param options - Configuration options
 */
export function useChapterDragAndDrop(
  projectId: string | null,
  chapters: Chapter[],
  options: UseChapterDragAndDropOptions = {},
): UseChapterDragAndDropResult {
  const [isReordering, setIsReordering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { onReorderStart, onReorderSuccess, onReorderError, optimistic = true } = options;

  /**
   * Reorder chapters by moving an item from startIndex to endIndex
   */
  const reorder = useCallback(
    async (startIndex: number, endIndex: number) => {
      if (!projectId) {
        const err = new Error('No project ID available');
        setError(err.message);
        onReorderError?.(err);
        return;
      }

      if (startIndex === endIndex) {
        return; // No change
      }

      setIsReordering(true);
      setError(null);

      try {
        // Create reordered array
        const reordered = arrayMove([...chapters], startIndex, endIndex);

        // Update order property for each chapter
        const withUpdatedOrder = reordered.map((chapter, index) => ({
          ...chapter,
          order: index,
        }));

        // Notify start
        onReorderStart?.(withUpdatedOrder);

        // If optimistic, update UI immediately
        if (optimistic) {
          onReorderSuccess?.(withUpdatedOrder);
        }

        // Call gateway with just IDs
        const chapterIds = withUpdatedOrder.map((c) => c.id);
        await reorderChaptersGateway(projectId, chapterIds);

        // If not optimistic, update after server confirms
        if (!optimistic) {
          onReorderSuccess?.(withUpdatedOrder);
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to reorder chapters');
        setError(error.message);
        onReorderError?.(error);
        throw error;
      } finally {
        setIsReordering(false);
      }
    },
    [projectId, chapters, onReorderStart, onReorderSuccess, onReorderError, optimistic],
  );

  /**
   * Reorder chapters using explicit array of IDs
   */
  const reorderByIds = useCallback(
    async (chapterIds: string[]) => {
      if (!projectId) {
        const err = new Error('No project ID available');
        setError(err.message);
        onReorderError?.(err);
        return;
      }

      setIsReordering(true);
      setError(null);

      try {
        // Create reordered chapters array
        const reordered = chapterIds
          .map((id) => chapters.find((c) => c.id === id))
          .filter(Boolean) as Chapter[];

        // Update order property
        const withUpdatedOrder = reordered.map((chapter, index) => ({
          ...chapter,
          order: index,
        }));

        // Notify start
        onReorderStart?.(withUpdatedOrder);

        // If optimistic, update UI immediately
        if (optimistic) {
          onReorderSuccess?.(withUpdatedOrder);
        }

        // Call gateway
        await reorderChaptersGateway(projectId, chapterIds);

        // If not optimistic, update after server confirms
        if (!optimistic) {
          onReorderSuccess?.(withUpdatedOrder);
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to reorder chapters');
        setError(error.message);
        onReorderError?.(error);
        throw error;
      } finally {
        setIsReordering(false);
      }
    },
    [projectId, chapters, onReorderStart, onReorderSuccess, onReorderError, optimistic],
  );

  return {
    reorder,
    reorderByIds,
    isReordering,
    error,
  };
}

/**
 * Helper function to move an item in an array
 */
function arrayMove<T>(array: T[], from: number, to: number): T[] {
  const item = array[from];
  if (item === undefined) {
    return array; // Return original array if index is out of bounds
  }
  const newArray = array.filter((_, index) => index !== from);
  newArray.splice(to, 0, item);
  return newArray;
}

/**
 * Helper to convert dnd-kit DragEndEvent to reorder params
 * Compatible with @dnd-kit/core
 *
 * Usage:
 * ```typescript
 * const handleDragEnd = (event: DragEndEvent) => {
 *   const params = getReorderParams(event, chapters);
 *   if (params) await reorder(params.startIndex, params.endIndex);
 * };
 * ```
 */
export function getReorderParams(
  event: { active: { id: string | number }; over: { id: string | number } | null },
  chapters: Chapter[],
): { startIndex: number; endIndex: number } | null {
  if (!event.over) return null;

  const activeId = String(event.active.id);
  const overId = String(event.over.id);

  const startIndex = chapters.findIndex((c) => c.id === activeId);
  const endIndex = chapters.findIndex((c) => c.id === overId);

  if (startIndex === -1 || endIndex === -1) return null;

  return { startIndex, endIndex };
}
