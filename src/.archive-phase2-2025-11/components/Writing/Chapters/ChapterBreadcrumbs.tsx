/**
 * ChapterBreadcrumbs
 *
 * Navigation breadcrumbs showing current chapter with prev/next navigation.
 * Displayed at the top of the editor for quick chapter switching.
 */

import { ChevronLeft, ChevronRight, Home } from 'lucide-react';
import React from 'react';

import { useChapters, ChapterHelpers } from '@/hooks/useChapters';

export interface ChapterBreadcrumbsProps {
  projectId: string | null;
  currentChapterId?: string;
  projectTitle?: string;
  onNavigateHome?: () => void;
  onNavigateToChapter?: (chapterId: string) => void;
  className?: string;
}

export default function ChapterBreadcrumbs({
  projectId,
  currentChapterId,
  projectTitle = 'Project',
  onNavigateHome,
  onNavigateToChapter,
  className = '',
}: ChapterBreadcrumbsProps) {
  const { chapters } = useChapters(projectId);

  if (!projectId || !currentChapterId) {
    return null;
  }

  const sortedChapters = ChapterHelpers.sortByOrder(chapters);
  const currentChapter = ChapterHelpers.findById(sortedChapters, currentChapterId);
  const prevChapter = currentChapter
    ? ChapterHelpers.getPrevious(sortedChapters, currentChapterId)
    : null;
  const nextChapter = currentChapter
    ? ChapterHelpers.getNext(sortedChapters, currentChapterId)
    : null;

  const currentIndex = currentChapter
    ? sortedChapters.findIndex((c) => c.id === currentChapterId) + 1
    : 0;

  return (
    <div
      className={`
        flex items-center justify-between gap-4 px-4 py-2
        bg-white border-b border-gray-200
        ${className}
      `}
    >
      {/* Left: Breadcrumb Path */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {/* Home Button */}
        {onNavigateHome && (
          <button
            onClick={onNavigateHome}
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-2 py-1 rounded"
            aria-label="Go to project home"
          >
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">{projectTitle}</span>
          </button>
        )}

        {/* Separator */}
        {onNavigateHome && <span className="text-gray-400">/</span>}

        {/* Current Chapter */}
        {currentChapter ? (
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs text-gray-500 shrink-0">
              Chapter {currentIndex} of {sortedChapters.length}
            </span>
            <span className="text-sm font-medium truncate" title={currentChapter.title}>
              {currentChapter.title}
            </span>
          </div>
        ) : (
          <span className="text-sm text-gray-500">No chapter selected</span>
        )}
      </div>

      {/* Right: Navigation Buttons */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => prevChapter && onNavigateToChapter?.(prevChapter.id)}
          disabled={!prevChapter}
          className={`
            flex items-center gap-1 px-3 py-1.5 text-sm rounded
            ${prevChapter ? 'text-gray-700 hover:bg-gray-100' : 'text-gray-400 cursor-not-allowed'}
          `}
          aria-label="Previous chapter"
          title={prevChapter ? `Previous: ${prevChapter.title}` : 'No previous chapter'}
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden md:inline">Prev</span>
        </button>

        <button
          onClick={() => nextChapter && onNavigateToChapter?.(nextChapter.id)}
          disabled={!nextChapter}
          className={`
            flex items-center gap-1 px-3 py-1.5 text-sm rounded
            ${nextChapter ? 'text-gray-700 hover:bg-gray-100' : 'text-gray-400 cursor-not-allowed'}
          `}
          aria-label="Next chapter"
          title={nextChapter ? `Next: ${nextChapter.title}` : 'No next chapter'}
        >
          <span className="hidden md:inline">Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
