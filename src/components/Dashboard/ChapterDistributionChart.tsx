/**
 * Chapter Distribution Chart Component (v0.7.0)
 *
 * Displays a bar chart showing word count distribution across chapters.
 * Simple CSS-based visualization without external chart libraries.
 * Theme-reactive: recomputes layout on theme changes.
 */

import { BarChart3 } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import type { Chapter } from '@/types/project';

interface ChapterDistributionChartProps {
  chapters: Chapter[];
  loading?: boolean;
}

export function ChapterDistributionChart({
  chapters,
  loading = false,
}: ChapterDistributionChartProps) {
  // Force re-render on theme change to ensure smooth transitions
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const handleThemeChange = () => {
      requestAnimationFrame(() => {
        forceUpdate((n) => n + 1);
      });
    };

    window.addEventListener('themechange', handleThemeChange);
    return () => window.removeEventListener('themechange', handleThemeChange);
  }, []);
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-6" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded flex-1" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (chapters.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
        <BarChart3 className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No chapters yet</h3>
        <p className="text-gray-500 dark:text-gray-400">
          Create chapters to see word count distribution
        </p>
      </div>
    );
  }

  // Sort chapters by order
  const sortedChapters = [...chapters].sort((a, b) => a.order - b.order);

  // Calculate max word count for scaling
  const maxWordCount = Math.max(...sortedChapters.map((ch) => ch.wordCount), 1);
  const totalWords = sortedChapters.reduce((sum, ch) => sum + ch.wordCount, 0);

  // Color palette for bars
  const getBarColor = (index: number) => {
    const colors = [
      'bg-blue-500 dark:bg-blue-600',
      'bg-purple-500 dark:bg-purple-600',
      'bg-pink-500 dark:bg-pink-600',
      'bg-orange-500 dark:bg-orange-600',
      'bg-green-500 dark:bg-green-600',
      'bg-indigo-500 dark:bg-indigo-600',
      'bg-cyan-500 dark:bg-cyan-600',
      'bg-teal-500 dark:bg-teal-600',
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Chapter Distribution
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {totalWords.toLocaleString()} total words across {chapters.length} chapter
            {chapters.length !== 1 ? 's' : ''}
          </p>
        </div>
        <BarChart3 className="w-5 h-5 text-gray-400 dark:text-gray-500" />
      </div>

      <div className="space-y-4">
        {sortedChapters.map((chapter, index) => {
          const percentage = maxWordCount > 0 ? (chapter.wordCount / maxWordCount) * 100 : 0;
          const wordPercentage = totalWords > 0 ? (chapter.wordCount / totalWords) * 100 : 0;

          return (
            <div key={chapter.id} className="group">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 flex-shrink-0">
                    Ch {index + 1}
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {chapter.title}
                  </span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {wordPercentage.toFixed(1)}%
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white min-w-[80px] text-right">
                    {chapter.wordCount.toLocaleString()} words
                  </span>
                </div>
              </div>

              <div className="relative h-8 bg-gray-100 dark:bg-gray-700/50 rounded-lg overflow-hidden">
                <div
                  className={`h-full ${getBarColor(index)} transition-all duration-500 ease-out rounded-lg flex items-center px-3 group-hover:opacity-90`}
                  style={{ width: `${percentage}%` }}
                >
                  {percentage > 15 && (
                    <span className="text-xs font-medium text-white">
                      {chapter.wordCount.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>

              {/* Chapter status badge */}
              {chapter.status && (
                <div className="mt-1.5">
                  <span
                    className={`inline-block text-xs px-2 py-0.5 rounded-full ${
                      chapter.status === 'completed'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : chapter.status === 'in-progress'
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
                    }`}
                  >
                    {chapter.status}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary stats */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {sortedChapters.length}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Chapters</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {totalWords.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total Words</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {sortedChapters.length > 0
                ? Math.round(totalWords / sortedChapters.length).toLocaleString()
                : 0}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Avg per Chapter</div>
          </div>
        </div>
      </div>
    </div>
  );
}
