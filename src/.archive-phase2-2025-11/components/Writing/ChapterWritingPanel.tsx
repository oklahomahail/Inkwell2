/**
 * Chapter-Based Writing Panel (v0.6.0 - Phase 4)
 *
 * This component integrates chapter-based writing with the existing editor.
 * Uses the new useChapters() hook from Phase 1 and ChapterBreadcrumbs from Phase 2.
 */

import { ChevronLeft, ChevronRight } from 'lucide-react';
import React, { useState, useCallback, useEffect } from 'react';

import AutosaveIndicator from '@/components/Topbar/AutosaveIndicator';
import { ChapterBreadcrumbs, ChapterListView } from '@/components/Writing/Chapters';
import TipTapEditor from '@/components/Writing/TipTapEditor';
import EnhancedChapterEditor from '@/editor/EnhancedChapterEditor';
import { useChapters, ChapterHelpers } from '@/hooks/useChapters';
import { cn } from '@/lib/utils';
import { AutosaveService } from '@/services/autosaveService';
import { countWords } from '@/utils/text';

// Feature flag for v0.8.0 enhanced editor with integrated autosave
const ENABLE_ENHANCED_EDITOR = import.meta.env.VITE_ENABLE_ENHANCED_EDITOR === 'true';

interface ChapterWritingPanelProps {
  projectId: string;
  projectTitle?: string;
  onNavigateHome?: () => void;
}

export default function ChapterWritingPanel({
  projectId,
  projectTitle = 'Project',
  onNavigateHome,
}: ChapterWritingPanelProps) {
  const { chapters, loading, saveChapter, updateContent } = useChapters(projectId);
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  const [editorContent, setEditorContent] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [saveTimeoutId, setSaveTimeoutId] = useState<NodeJS.Timeout | null>(null);

  // Create AutosaveService instance for enhanced editor (v0.8.0)
  const [autosaveService] = useState(() => {
    if (!ENABLE_ENHANCED_EDITOR) return null;

    return new AutosaveService(async (chapterId: string, content: string) => {
      const wordCount = countWords(content);
      await updateContent(chapterId, content, wordCount);
      return { checksum: `${chapterId}-${Date.now()}` };
    }, 1000);
  });

  // Get the active chapter from chapters array
  const activeChapter = ChapterHelpers.findById(chapters, activeChapterId ?? '');
  const sortedChapters = ChapterHelpers.sortByOrder(chapters);

  // Auto-select first chapter on mount or when chapters change
  useEffect(() => {
    if (!activeChapterId && sortedChapters.length > 0 && sortedChapters[0]) {
      setActiveChapterId(sortedChapters[0].id);
    }
  }, [activeChapterId, sortedChapters]);

  // Load chapter content when active chapter changes
  useEffect(() => {
    if (activeChapter) {
      setEditorContent(activeChapter.content || '');
    }
  }, [activeChapter]); // Load content whenever activeChapter reference changes

  // Debounced autosave - saves 1 second after user stops typing
  useEffect(() => {
    if (!activeChapter) return;

    // Clear existing timeout
    if (saveTimeoutId) {
      clearTimeout(saveTimeoutId);
    }

    // Don't save if content hasn't changed
    if (editorContent === (activeChapter.content || '')) {
      return;
    }

    // Set new timeout for autosave
    const timeoutId = setTimeout(async () => {
      setIsSaving(true);
      try {
        const wordCount = countWords(editorContent);
        await updateContent(activeChapter.id, editorContent, wordCount);
        setLastSavedAt(new Date());
      } catch (error) {
        console.error('Failed to save chapter:', error);
      } finally {
        setIsSaving(false);
      }
    }, 1000);

    setSaveTimeoutId(timeoutId);

    // Cleanup on unmount
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [editorContent, activeChapter, updateContent, saveTimeoutId]); // All dependencies included

  // Handle editor content changes
  const handleContentChange = useCallback((content: string) => {
    setEditorContent(content);
  }, []);

  // Handle chapter selection
  const handleChapterSelect = useCallback((chapterId: string) => {
    setActiveChapterId(chapterId);
  }, []);

  // Handle chapter creation
  const handleChapterCreate = useCallback(() => {
    // ChapterListView handles creation internally
  }, []);

  // Navigate to previous/next chapter
  const handleNavigateToChapter = useCallback(
    (direction: 'prev' | 'next') => {
      if (!activeChapter) return;

      const targetChapter =
        direction === 'prev'
          ? ChapterHelpers.getPrevious(sortedChapters, activeChapter.id)
          : ChapterHelpers.getNext(sortedChapters, activeChapter.id);

      if (targetChapter) {
        setActiveChapterId(targetChapter.id);
      }
    },
    [activeChapter, sortedChapters],
  );

  // Handle title changes
  const handleTitleChange = useCallback(
    async (newTitle: string) => {
      if (!activeChapter) return;

      try {
        await saveChapter({
          ...activeChapter,
          title: newTitle,
          updatedAt: Date.now(),
        });
      } catch (error) {
        console.error('Failed to update chapter title:', error);
      }
    },
    [activeChapter, saveChapter],
  );

  // Format last saved time
  const formatLastSaved = (date: Date | null): string => {
    if (!date) return '';
    const minutes = Math.max(1, Math.round((Date.now() - date.getTime()) / 60000));
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.round(minutes / 60);
    return `${hours} h ago`;
  };

  if (loading && chapters.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading chapters...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-gray-50 dark:bg-gray-900">
      {/* Chapter Sidebar */}
      {showSidebar && (
        <div className="w-80 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 dark:text-white">Chapters</h2>
            <button
              onClick={() => setShowSidebar(false)}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="Hide sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
          <ChapterListView
            projectId={projectId}
            activeChapterId={activeChapterId ?? undefined}
            onChapterSelect={handleChapterSelect}
            onChapterCreate={handleChapterCreate}
            className="h-[calc(100%-4rem)]"
          />
        </div>
      )}

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Breadcrumbs Navigation */}
        {activeChapter && (
          <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-3">
            <ChapterBreadcrumbs
              projectId={projectId}
              currentChapterId={activeChapter.id}
              projectTitle={projectTitle}
              onNavigateHome={onNavigateHome}
              onNavigateToChapter={handleChapterSelect}
            />
          </div>
        )}

        {/* Toolbar */}
        <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {!showSidebar && (
                <button
                  onClick={() => setShowSidebar(true)}
                  className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                  aria-label="Show sidebar"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}

              {/* Chapter navigation arrows */}
              {activeChapter && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleNavigateToChapter('prev')}
                    disabled={!ChapterHelpers.getPrevious(sortedChapters, activeChapter.id)}
                    className={cn(
                      'p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700',
                      !ChapterHelpers.getPrevious(sortedChapters, activeChapter.id) &&
                        'opacity-50 cursor-not-allowed',
                    )}
                    aria-label="Previous chapter"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleNavigateToChapter('next')}
                    disabled={!ChapterHelpers.getNext(sortedChapters, activeChapter.id)}
                    className={cn(
                      'p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700',
                      !ChapterHelpers.getNext(sortedChapters, activeChapter.id) &&
                        'opacity-50 cursor-not-allowed',
                    )}
                    aria-label="Next chapter"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              {/* Autosave indicator */}
              {activeChapter && ENABLE_ENHANCED_EDITOR && autosaveService ? (
                <AutosaveIndicator service={autosaveService} />
              ) : activeChapter && !ENABLE_ENHANCED_EDITOR ? (
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  {isSaving ? (
                    <>
                      <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                      <span>Saving...</span>
                    </>
                  ) : lastSavedAt ? (
                    <>
                      <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full" />
                      <span>Saved {formatLastSaved(lastSavedAt)}</span>
                    </>
                  ) : (
                    <span>—</span>
                  )}
                </div>
              ) : null}
              {/* Word count and status */}
              {activeChapter && (
                <div className="text-sm text-gray-500">
                  {countWords(editorContent).toLocaleString()} words · {activeChapter.status}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chapter Title */}
        {activeChapter && (
          <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-4">
            <input
              value={activeChapter.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Chapter title"
              className="text-2xl font-semibold outline-none w-full bg-transparent text-gray-900 dark:text-white border-0 focus:ring-0"
            />
          </div>
        )}

        {/* Editor */}
        <div className="flex-1 overflow-auto bg-white dark:bg-gray-900">
          {activeChapter ? (
            <div className="max-w-4xl mx-auto px-6 py-8">
              {ENABLE_ENHANCED_EDITOR && autosaveService ? (
                <EnhancedChapterEditor
                  chapterId={activeChapter.id}
                  initialContent={editorContent}
                  saveFn={async (id: string, content: string) => {
                    const wordCount = countWords(content);
                    await updateContent(id, content, wordCount);
                    return { checksum: `${id}-${Date.now()}` };
                  }}
                  onSaved={() => setLastSavedAt(new Date())}
                  className="min-h-full"
                />
              ) : (
                <TipTapEditor
                  value={editorContent}
                  onChange={handleContentChange}
                  placeholder="Start writing…"
                  className="min-h-full"
                />
              )}
            </div>
          ) : chapters.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center max-w-md">
                <p className="mb-4 text-lg">No chapters yet</p>
                <p className="text-sm">
                  Click "New Chapter" in the sidebar to create your first chapter.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <p>Select a chapter from the sidebar to start writing</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
