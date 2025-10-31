/**
 * ChapterListView
 *
 * Modern chapter list component using v0.6.0 hooks architecture.
 * Features:
 * - Drag-and-drop reordering
 * - Inline editing
 * - Status badges
 * - Word count tracking
 * - Collapse/expand states
 * - Create/delete operations
 *
 * Usage:
 * ```tsx
 * <ChapterListView projectId={projectId} onChapterSelect={handleSelect} />
 * ```
 */

import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import React, { useState } from 'react';

import { useChapterDragAndDrop, getReorderParams } from '@/hooks/useChapterDragAndDrop';
import { useChapters, ChapterHelpers } from '@/hooks/useChapters';
import type { Chapter } from '@/types/project';

import ChapterListItem from './ChapterListItem';

export interface ChapterListViewProps {
  projectId: string | null;
  activeChapterId?: string;
  onChapterSelect?: (chapterId: string) => void;
  onChapterCreate?: (chapter: Chapter) => void;
  className?: string;
}

export default function ChapterListView({
  projectId,
  activeChapterId,
  onChapterSelect,
  onChapterCreate,
  className = '',
}: ChapterListViewProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  // Use new hooks from Phase 1
  const {
    chapters,
    loading,
    error,
    createChapter,
    deleteChapter: deleteChapterHook,
    saveChapter,
  } = useChapters(projectId);

  const { reorder, isReordering } = useChapterDragAndDrop(projectId, chapters, {
    optimistic: true,
  });

  // Sort chapters by order
  const sortedChapters = ChapterHelpers.sortByOrder(chapters);
  const chapterIds = sortedChapters.map((c) => c.id);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required to start drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const params = getReorderParams(event, sortedChapters);
    if (!params) return;

    const { startIndex, endIndex } = params;
    await reorder(startIndex, endIndex);
  };

  const handleCreateChapter = async () => {
    if (!projectId) return;

    setIsCreating(true);
    try {
      const nextIndex = chapters.length;
      const chapter = await createChapter(`Chapter ${nextIndex + 1}`, {
        order: nextIndex,
        status: 'in-progress',
        content: '',
        wordCount: 0,
      });

      onChapterCreate?.(chapter);
      onChapterSelect?.(chapter.id);
    } catch (err) {
      console.error('Failed to create chapter:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteChapter = async (chapterId: string) => {
    if (!projectId) return;

    const chapter = ChapterHelpers.findById(sortedChapters, chapterId);
    if (!chapter) return;

    const confirmed = window.confirm(
      `Delete "${chapter.title}"?\n\nThis will permanently delete ${chapter.wordCount} words.`,
    );

    if (!confirmed) return;

    try {
      await deleteChapterHook(chapterId);

      // If deleted chapter was active, select another
      if (activeChapterId === chapterId && sortedChapters.length > 1) {
        const nextChapter =
          ChapterHelpers.getNext(sortedChapters, chapterId) ||
          ChapterHelpers.getPrevious(sortedChapters, chapterId);
        if (nextChapter) {
          onChapterSelect?.(nextChapter.id);
        }
      }
    } catch (err) {
      console.error('Failed to delete chapter:', err);
    }
  };

  const handleToggleCollapse = (chapterId: string) => {
    setCollapsed((prev) => ({
      ...prev,
      [chapterId]: !prev[chapterId],
    }));
  };

  const handleTitleChange = async (chapterId: string, newTitle: string) => {
    if (!projectId) return;

    const chapter = ChapterHelpers.findById(sortedChapters, chapterId);
    if (!chapter) return;

    try {
      await saveChapter({
        ...chapter,
        title: newTitle,
        updatedAt: Date.now(),
      });
    } catch (err) {
      console.error('Failed to update chapter title:', err);
    }
  };

  if (!projectId) {
    return <div className={`p-4 text-center text-gray-500 ${className}`}>No project selected</div>;
  }

  if (loading) {
    return (
      <div className={`p-4 text-center ${className}`}>
        <div className="animate-pulse">Loading chapters...</div>
      </div>
    );
  }

  if (error) {
    return <div className={`p-4 text-center text-red-600 ${className}`}>Error: {error}</div>;
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h2 className="text-lg font-semibold">Chapters</h2>
          <p className="text-xs text-gray-500">
            {chapters.length} {chapters.length === 1 ? 'chapter' : 'chapters'} •{' '}
            {ChapterHelpers.getTotalWords(chapters).toLocaleString()} words
          </p>
        </div>

        <button
          onClick={handleCreateChapter}
          disabled={isCreating || !projectId}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Create new chapter"
        >
          <Plus className="w-4 h-4" />
          New Chapter
        </button>
      </div>

      {/* Chapter List */}
      <div className="flex-1 overflow-y-auto p-2">
        {sortedChapters.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No chapters yet</p>
            <button
              onClick={handleCreateChapter}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Create your first chapter
            </button>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToVerticalAxis]}
          >
            <SortableContext items={chapterIds} strategy={verticalListSortingStrategy}>
              <div className="space-y-1">
                {sortedChapters.map((chapter) => (
                  <ChapterListItem
                    key={chapter.id}
                    chapter={chapter}
                    isActive={chapter.id === activeChapterId}
                    isCollapsed={collapsed[chapter.id]}
                    isDragging={isReordering}
                    onSelect={() => onChapterSelect?.(chapter.id)}
                    onDelete={() => handleDeleteChapter(chapter.id)}
                    onToggleCollapse={() => handleToggleCollapse(chapter.id)}
                    onTitleChange={(newTitle) => handleTitleChange(chapter.id, newTitle)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Footer Stats */}
      <div className="border-t p-3 bg-gray-50">
        <div className="flex justify-between text-xs text-gray-600">
          <span>Progress: {ChapterHelpers.getProgressPercentage(chapters)}%</span>
          <span>Completed: {ChapterHelpers.filterByStatus(chapters, 'completed').length}</span>
        </div>
      </div>
    </div>
  );
}
