/**
 * Preview Writer Component
 * Simplified read-only writing interface for preview mode
 * Shows demo project with disabled save/export/AI features
 */

import { BookOpen, ChevronLeft, ChevronRight, Lock, AlertCircle } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

import { trackPreviewOpened, trackPreviewFeatureBlocked, trackPreviewCTA } from './analytics';
import PreviewBanner from './PreviewBanner';
import { useDemoStore } from './useDemoStore';

export function PreviewWriter() {
  const { project, actions } = useDemoStore();
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [editorContent, setEditorContent] = useState('');

  const currentChapter = project.chapters[currentChapterIndex];

  useEffect(() => {
    trackPreviewOpened('writer');
  }, []);

  useEffect(() => {
    if (currentChapter) {
      setEditorContent(currentChapter.content);
    }
  }, [currentChapter]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setEditorContent(newContent);

    // Update in memory only (not persisted)
    if (currentChapter) {
      actions.updateChapterLocally(currentChapter.id, newContent);
    }
  };

  const handleNextChapter = () => {
    if (currentChapterIndex < project.chapters.length - 1) {
      setCurrentChapterIndex(currentChapterIndex + 1);
    }
  };

  const handlePrevChapter = () => {
    if (currentChapterIndex > 0) {
      setCurrentChapterIndex(currentChapterIndex - 1);
    }
  };

  const handleFeatureClick = (feature: string) => {
    trackPreviewFeatureBlocked(feature);
    trackPreviewCTA('signup', `blocked_${feature}`);
  };

  const wordCount = editorContent.split(/\s+/).filter(Boolean).length;

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-900">
      <PreviewBanner />

      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BookOpen className="w-6 h-6 text-slate-700 dark:text-slate-300" />
            <div>
              <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
                {project.name}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Preview Mode</p>
            </div>
          </div>

          {/* Disabled Actions */}
          <div className="flex items-center gap-2">
            <Link
              to="/signup?from=preview"
              onClick={() => handleFeatureClick('save')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 rounded-lg cursor-not-allowed"
              title="Save is disabled in preview mode"
            >
              <Lock className="w-4 h-4" />
              <span className="text-sm font-medium">Save</span>
            </Link>
            <Link
              to="/signup?from=preview"
              onClick={() => handleFeatureClick('export')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 rounded-lg cursor-not-allowed"
              title="Export is disabled in preview mode"
            >
              <Lock className="w-4 h-4" />
              <span className="text-sm font-medium">Export</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Chapter Navigation Sidebar */}
        <aside className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 overflow-y-auto">
          <div className="p-4">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
              Chapters
            </h2>
            <div className="space-y-1">
              {project.chapters.map((chapter, index) => (
                <button
                  key={chapter.id}
                  onClick={() => setCurrentChapterIndex(index)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    index === currentChapterIndex
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-medium'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate">{chapter.title}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">
                      {chapter.wordCount}w
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Info Box */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-700">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-blue-900 dark:text-blue-100">
                  <p className="font-medium mb-1">Demo Mode Active</p>
                  <p className="text-blue-700 dark:text-blue-300">
                    Changes won't be saved.{' '}
                    <Link
                      to="/signup?from=preview"
                      onClick={() => trackPreviewCTA('signup', 'sidebar_info')}
                      className="underline font-medium hover:text-blue-800 dark:hover:text-blue-200"
                    >
                      Create account
                    </Link>{' '}
                    to save your work.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Editor Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Chapter Header */}
          <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                  {currentChapter?.title}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {wordCount} words • Chapter {currentChapterIndex + 1} of {project.chapters.length}
                </p>
              </div>

              {/* Chapter Navigation */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevChapter}
                  disabled={currentChapterIndex === 0}
                  className="p-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Previous chapter"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={handleNextChapter}
                  disabled={currentChapterIndex === project.chapters.length - 1}
                  className="p-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Next chapter"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Editor */}
          <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-900">
            <div className="max-w-4xl mx-auto px-6 py-8">
              <textarea
                value={editorContent}
                onChange={handleContentChange}
                className="w-full min-h-[600px] resize-none bg-transparent text-slate-900 dark:text-slate-100 text-lg leading-relaxed focus:outline-none font-serif"
                placeholder="Start writing..."
                spellCheck={false}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default PreviewWriter;
