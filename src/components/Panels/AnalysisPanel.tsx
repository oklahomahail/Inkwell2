// src/components/Panels/AnalysisPanel.tsx
import React, { useEffect, useState } from 'react';
import { useAppContext } from '@/context/AppContext';

interface WritingSession {
  date: string;
  wordCount: number;
  duration?: number;
}

const AnalysisPanel: React.FC = () => {
  const { state, currentProject } = useAppContext();
  const [sessions, setSessions] = useState<WritingSession[]>([]);

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

  const totalWords = sessions.reduce((acc, session) => acc + (session.wordCount || 0), 0);
  const totalDays = sessions.length;
  const averageWordsPerDay = totalDays > 0 ? Math.round(totalWords / totalDays) : 0;

  const sortedSessions = [...sessions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Writing Analytics</h1>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Project: {currentProject?.name ?? state.currentProjectId ?? 'None selected'}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">Total Words Written</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {totalWords.toLocaleString()}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">Writing Days</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalDays}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">Avg Words per Day</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {averageWordsPerDay}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recent Sessions
        </h2>
        {sortedSessions.length === 0 ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">No data available yet.</div>
        ) : (
          <ul className="space-y-2">
            {sortedSessions
              .slice(-10)
              .reverse()
              .map((session, index) => (
                <li
                  key={`${session.date}-${index}`}
                  className="flex justify-between items-center px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-md"
                >
                  <span className="text-sm text-gray-700 dark:text-gray-200">{session.date}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {session.wordCount} words
                  </span>
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default AnalysisPanel;
