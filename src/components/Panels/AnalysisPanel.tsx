// src/components/Panels/AnalysisPanel.tsx - Upgraded Version
import { BarChart3, TrendingUp, Clock, Target } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import WritingAnalyticsView from '@/components/Analytics/WritingAnalyticsView';
import { useAppContext } from '@/context/AppContext';

interface WritingSession {
  date: string;
  wordCount: number;
  duration?: number;
}

const AnalysisPanel: React.FC = () => {
  const { state, currentProject } = useAppContext();
  const [sessions, setSessions] = useState<WritingSession[]>([]);
  const [viewMode, setViewMode] = useState<'simple' | 'advanced'>('advanced');

  useEffect(() => {
    const savedSessions = localStorage.getItem(
      `sessions-${currentProject?.id ?? state.currentProjectId ?? 'default'}`,
    );
    if (savedSessions) {
      try {
        const parsed: WritingSession[] = JSON.parse(savedSessions);
        const cleaned = parsed.filter(
          (s) => typeof s.date === 'string' && typeof s.wordCount === 'number',
        );
        setSessions(cleaned);
      } catch {
        setSessions([]);
      }
    }
  }, [currentProject?.id, state.currentProjectId]);

  // If we have a current project with enhanced analytics, use the advanced view
  const hasEnhancedAnalytics = currentProject && 'sessions' in currentProject;

  // Simple Analytics View (your existing component, enhanced)
  const SimpleAnalyticsView = () => {
    const totalWords = sessions.reduce((acc, session) => acc + (session.wordCount || 0), 0);
    const totalDays = sessions.length;
    const averageWordsPerDay = totalDays > 0 ? Math.round(totalWords / totalDays) : 0;

    const sortedSessions = [...sessions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    return (
      <div className="p-6 space-y-6">
        {/* Header with View Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Writing Analytics</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Project: {currentProject?.name ?? state.currentProjectId ?? 'None selected'}
            </p>
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
              {totalWords.toLocaleString()}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <Clock className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Writing Days</div>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalDays}</div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Daily Average</div>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {averageWordsPerDay}
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
              {Math.min(totalDays, 7)} days
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
                      {session.wordCount > averageWordsPerDay && (
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

  // Render based on mode and available data
  if (viewMode === 'advanced' && hasEnhancedAnalytics) {
    return <WritingAnalyticsView />;
  }

  return <SimpleAnalyticsView />;
};

export default AnalysisPanel;
