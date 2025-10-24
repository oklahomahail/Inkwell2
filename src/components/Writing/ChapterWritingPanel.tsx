/**
 * Chapter-Based Writing Panel
 *
 * This component integrates chapter-based writing with the existing editor.
 * It provides a sidebar for chapter navigation and management.
 */

import React, { useEffect } from 'react';

import ChapterSidebar from '@/components/Writing/Chapters/ChapterSidebar';
import SplitIntoChaptersButton from '@/components/Writing/Chapters/SplitIntoChaptersButton';
import TipTapEditor from '@/components/Writing/TipTapEditor';
import { useChapters, chaptersActions } from '@/context/ChaptersContext';
import { useChapterDocument } from '@/hooks/useChapterDocument';
import { countWords } from '@/utils/text';

export default function ChapterWritingPanel({ projectId }: { projectId: string }) {
  const { dispatch, getActiveChapter, getChapters } = useChapters();
  const chapter = getActiveChapter();
  const chapters = getChapters(projectId);
  const { content, setContent, isSaving, lastSavedAt } = useChapterDocument(chapter?.id);

  // Load chapters on mount
  useEffect(() => {
    (async () => {
      const { Chapters } = await import('@/services/chaptersService');
      const chapterList = await Chapters.list(projectId);
      dispatch(chaptersActions.loadForProject(projectId, chapterList));
    })();
  }, [projectId, dispatch]);

  // Keep wordCount in meta current
  useEffect(() => {
    if (!chapter) return;
    const wc = countWords(content);
    if (wc !== chapter.wordCount) {
      dispatch(
        chaptersActions.updateMeta({
          ...chapter,
          wordCount: wc,
          updatedAt: new Date().toISOString(),
        }),
      );
    }
  }, [content, chapter, dispatch]);

  // Update chapter title
  const handleTitleChange = (newTitle: string) => {
    if (!chapter) return;
    dispatch(
      chaptersActions.updateMeta({
        ...chapter,
        title: newTitle,
        updatedAt: new Date().toISOString(),
      }),
    );
  };

  // Format last saved time
  const formatLastSaved = (isoString: string | null): string => {
    if (!isoString) return '';
    const minutes = Math.max(1, Math.round((Date.now() - new Date(isoString).getTime()) / 60000));
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.round(minutes / 60);
    return `${hours} h ago`;
  };

  return (
    <div className="flex h-full">
      <ChapterSidebar projectId={projectId} />
      <div className="flex-1 flex flex-col p-6 overflow-auto">
        {/* Toolbar */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SplitIntoChaptersButton
              projectId={projectId}
              editorContent={content}
              onClearMonolith={() => setContent('')}
            />
          </div>
          <div className="flex items-center gap-4">
            {/* Autosave indicator */}
            {chapter && (
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
            )}
            {/* Word count and status */}
            {chapter && (
              <div className="text-sm text-gray-500">
                {chapter.wordCount} words · {chapter.status}
              </div>
            )}
          </div>
        </div>

        {/* Chapter Title */}
        {chapter && (
          <input
            value={chapter.title ?? ''}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Chapter title"
            className="text-2xl font-semibold outline-none mb-6 w-full border-b pb-2 focus:border-gray-400 transition"
          />
        )}

        {/* Editor */}
        {chapter ? (
          <div className="flex-1 min-h-0">
            <TipTapEditor value={content} onChange={setContent} placeholder="Start writing…" />
          </div>
        ) : chapters.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <p className="mb-4">No chapters yet</p>
              <p className="text-sm">
                Click "New" in the sidebar to create your first chapter, or use "Split into
                Chapters" to import existing content.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <p>Select a chapter from the sidebar to start writing</p>
          </div>
        )}
      </div>
    </div>
  );
}
