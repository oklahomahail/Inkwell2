// src/components/Panels/AnalysisPanel.tsx - Upgraded Version
import { BarChart3, TrendingUp, Clock, Target, BookOpen, FileText } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import WritingAnalyticsView from '@/components/Analytics/WritingAnalyticsView';
import { Logo } from '@/components/ui/Logo';
import { useAppContext } from '@/context/AppContext';
import { useChapters } from '@/context/ChaptersContext';
import { useProjectAnalytics } from '@/hooks/useProjectAnalytics';
import { Chapters } from '@/services/chaptersService';
import { triggerAnalyticsVisited } from '@/utils/tourTriggers';

const AnalyticsPanel: React.FC = () => {
  const { state, currentProject } = useAppContext();
  const [viewMode, setViewMode] = useState<'simple' | 'advanced'>('advanced');
  const { dispatch } = useChapters();
  const projectId = currentProject?.id ?? state.currentProjectId ?? '';
  const isDemo = currentProject?.isDemo ?? false;

  // Load fresh chapter data from IndexedDB on mount and when project changes
  useEffect(() => {
    if (!projectId || isDemo) return;

    const loadChapters = async () => {
      try {
        const chapters = await Chapters.list(projectId);
        dispatch({
          type: 'LOAD_FOR_PROJECT',
          payload: { projectId, chapters },
        });
      } catch (error) {
        console.error('[AnalyticsPanel] Failed to load chapters:', error);
      }
    };

    // Load immediately
    loadChapters();

    // Refresh every 3 seconds to pick up live changes from WritingPanel
    const interval = setInterval(loadChapters, 3000);

    return () => clearInterval(interval);
  }, [projectId, dispatch, isDemo]);

  // Get comprehensive analytics with chapter integration
  const analytics = useProjectAnalytics(projectId);

  // Fire tour trigger on component mount
  useEffect(() => {
    triggerAnalyticsVisited();
  }, []);

  // Check if we have real analytics data (chapters or sessions)
  // Instead of checking for 'sessions' property on project object (which doesn't exist)
  const hasEnhancedAnalytics =
    currentProject &&
    (analytics.chapters.chapterWords > 0 ||
      analytics.sessions.length > 0 ||
      analytics.totals.daysWithWriting > 0);

  // Simple Analytics View (enhanced with chapter integration)
  const SimpleAnalyticsView = () => {
    const { totals, chapters, notice } = analytics;

    const sortedSessions = [...analytics.sessions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    return (
      <div data-tour="analytics-panel-root" className="p-6 space-y-6">
        {/* Header with View Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Inkwell Logo */}
            <Logo size={40} className="flex-shrink-0" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Writing Analytics
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Project: {currentProject?.name ?? state.currentProjectId ?? 'None selected'}
              </p>
            </div>
          </div>

          {hasEnhancedAnalytics && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('simple')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  viewMode === 'simple'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                Simple
              </button>
              <button
                onClick={() => setViewMode('advanced')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  viewMode === 'advanced'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                Advanced
              </button>
            </div>
          )}
        </div>

        {/* Notice about data source */}
        {notice && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <div>
                <div className="text-sm font-medium text-blue-900 dark:text-blue-100">{notice}</div>
                <div className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  Start typing to record writing sessions automatically.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Total Words</div>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {totals.totalWords.toLocaleString()}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <Clock className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Writing Days</div>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {totals.daysWithWriting}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Daily Average</div>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {totals.dailyAvg.toLocaleString()}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <TrendingUp className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Streak</div>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {totals.streak} day{totals.streak !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Chapter Stats Section */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Chapter Statistics
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Chapters</div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  {chapters.chapterCount}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Manuscript Words</div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  {chapters.chapterWords.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-100 dark:bg-teal-900 rounded-lg">
                <Target className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Avg Words/Chapter</div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  {chapters.avgWordsPerChapter.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Longest Chapter</div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-[120px]">
                  {chapters.longestChapter?.title ?? '—'}
                </div>
                {chapters.longestChapter && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {chapters.longestChapter.wordCount.toLocaleString()} words
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Sessions */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Sessions</h2>
            {hasEnhancedAnalytics && (
              <button
                onClick={() => setViewMode('advanced')}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
              >
                View Advanced Analytics →
              </button>
            )}
          </div>

          {sortedSessions.length === 0 ? (
            <div className="text-center py-8">
              <BarChart3 className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
              <div className="text-sm text-gray-500 dark:text-gray-400">
                No writing sessions recorded yet.
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Start writing to see your analytics!
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {sortedSessions
                .slice(-10)
                .reverse()
                .map((session, index) => (
                  <div
                    key={`${session.date}-${index}`}
                    className="flex justify-between items-center px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {new Date(session.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      {session.duration && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                          {session.duration}m
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {session.wordCount} words
                      </span>
                      {session.wordCount > totals.dailyAvg && totals.dailyAvg > 0 && (
                        <TrendingUp className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Upgrade Notice */}
        {!hasEnhancedAnalytics && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <div>
                <div className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Enhanced Analytics Available
                </div>
                <div className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  Create a new project to access advanced analytics with charts, progress tracking,
                  and detailed insights.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Don't show analytics for demo/tutorial projects
  if (isDemo) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <div className="text-center space-y-4">
          <Logo size={48} className="mx-auto opacity-50" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Tutorial Project
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Analytics are not tracked for the welcome tutorial project.
              <br />
              Create a new project to start tracking your writing progress.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Render based on mode and available data
  if (viewMode === 'advanced' && hasEnhancedAnalytics) {
    return <WritingAnalyticsView />;
  }

  return <SimpleAnalyticsView />;
};

export default AnalyticsPanel;
