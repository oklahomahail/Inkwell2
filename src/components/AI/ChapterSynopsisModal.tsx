// src/components/AI/ChapterSynopsisModal.tsx
import { X, Wand2, RefreshCw, BookOpen, Sparkles, AlertCircle } from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';

import { AIDisclosureHint } from '@/components/AI/AIDisclosureHint';
import {
  generateChapterSynopsis,
  getStoredChapterSynopsis,
} from '@/services/ai/chapterSynopsisService';
import type { ChapterSynopsis } from '@/types/ai';
import type { Chapter } from '@/types/project';

interface ChapterSynopsisModalProps {
  isOpen: boolean;
  onClose: () => void;
  chapter: Chapter;
  projectId: string;
  onAccept?: (synopsis: ChapterSynopsis) => void;
}

export default function ChapterSynopsisModal({
  isOpen,
  onClose,
  chapter,
  projectId,
  onAccept,
}: ChapterSynopsisModalProps) {
  const [synopsis, setSynopsis] = useState<ChapterSynopsis | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasExisting, setHasExisting] = useState(false);

  // Load existing synopsis when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const loadExisting = async () => {
      try {
        const stored = await getStoredChapterSynopsis(chapter.id);
        if (stored && stored.content) {
          setSynopsis(stored.content as ChapterSynopsis);
          setHasExisting(true);
        }
      } catch (err) {
        // No existing synopsis, that's fine
        setHasExisting(false);
      }
    };

    loadExisting();
  }, [isOpen, chapter.id]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setError(null);
      setIsGenerating(false);
    }
  }, [isOpen]);

  const handleGenerate = useCallback(
    async (regenerate = false) => {
      if (!chapter.content?.trim()) {
        setError('Chapter has no content to analyze');
        return;
      }

      setIsGenerating(true);
      setError(null);

      try {
        const result = await generateChapterSynopsis(chapter, projectId, {
          bypassCache: regenerate,
        });

        if (result.success && result.data) {
          setSynopsis(result.data);
          setHasExisting(true);
        } else {
          setError(result.error?.message || 'Failed to generate synopsis');
        }
      } catch (err: any) {
        console.error('Chapter Synopsis error:', err);
        setError(err instanceof Error ? err.message : 'Failed to generate synopsis');
      } finally {
        setIsGenerating(false);
      }
    },
    [chapter, projectId],
  );

  const handleAccept = () => {
    if (synopsis && onAccept) {
      onAccept(synopsis);
    }
    onClose();
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/60 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-xl shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Chapter Synopsis
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {chapter.title || 'Untitled Chapter'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* AI Disclosure */}
          <AIDisclosureHint />

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800 dark:text-red-300">
                  Error generating synopsis
                </p>
                <p className="text-sm text-red-700 dark:text-red-400 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Generate Button */}
          {!synopsis && !isGenerating && (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Generate Chapter Synopsis
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                AI will analyze this chapter and generate a structured summary with key beats,
                emotional arc, and conflicts.
              </p>
              <button
                onClick={() => handleGenerate(false)}
                disabled={!chapter.content?.trim()}
                className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              >
                <Wand2 className="w-5 h-5" />
                Generate Synopsis
              </button>
              {!chapter.content?.trim() && (
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-3">
                  Chapter must have content to generate a synopsis
                </p>
              )}
            </div>
          )}

          {/* Loading State */}
          {isGenerating && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center animate-pulse">
                <Wand2 className="w-8 h-8 text-amber-600 dark:text-amber-400 animate-spin" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Analyzing Chapter...
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">This may take a moment</p>
            </div>
          )}

          {/* Synopsis Display */}
          {synopsis && !isGenerating && (
            <div className="space-y-6">
              {/* Summary */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Summary
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-slate-800 p-4 rounded-lg">
                  {synopsis.summary}
                </p>
              </div>

              {/* Key Beats */}
              {synopsis.keyBeats && synopsis.keyBeats.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Key Beats
                  </h3>
                  <ul className="space-y-2">
                    {synopsis.keyBeats.map((beat, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-slate-800 p-3 rounded-lg"
                      >
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 flex items-center justify-center text-xs font-semibold">
                          {index + 1}
                        </span>
                        <span className="flex-1">{beat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Emotional Arc */}
              {synopsis.emotionalArc && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <span className="text-purple-600 dark:text-purple-400">❤️</span>
                    Emotional Arc
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                    {synopsis.emotionalArc}
                  </p>
                </div>
              )}

              {/* Conflicts */}
              {synopsis.conflicts && synopsis.conflicts.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <span className="text-red-600 dark:text-red-400">⚔️</span>
                    Conflicts
                  </h3>
                  <ul className="space-y-2">
                    {synopsis.conflicts.map((conflict, index) => (
                      <li
                        key={index}
                        className="text-sm text-gray-700 dark:text-gray-300 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800 pl-4"
                        style={{ listStyleType: 'disc', marginLeft: '1.5rem' }}
                      >
                        {conflict}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Generated timestamp */}
              <p className="text-xs text-gray-500 dark:text-gray-500 text-center">
                Generated {new Date(synopsis.generatedAt).toLocaleString()}
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {synopsis && !isGenerating && (
          <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between gap-3">
            <button
              onClick={() => handleGenerate(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Regenerate
            </button>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                Close
              </button>
              {onAccept && (
                <button
                  onClick={handleAccept}
                  className="px-6 py-2 text-sm bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors"
                >
                  Save to Chapter
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
