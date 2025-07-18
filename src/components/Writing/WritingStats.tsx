// src/components/Writing/WritingStats.tsx
import React, { useMemo } from 'react';
import { useStorageQuota } from '../../hooks/useStorageQuota';
import { analyzeText } from '../../utils/textAnalysis';

interface WritingStatsProps {
  content: string;
  title: string;
  storageQuota?: ReturnType<typeof useStorageQuota>;
}

const WritingStats: React.FC<WritingStatsProps> = ({ content, title, storageQuota }) => {
  const stats = useMemo(() => analyzeText(content), [content]);

  return (
    <aside className="w-64 p-4 border-l border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
      <h3 className="text-lg font-semibold mb-3">Document Stats</h3>
      <ul className="space-y-2 text-sm">
        <li>
          <strong>Title:</strong> {title || 'Untitled'}
        </li>
        <li>
          <strong>Words:</strong> {stats.wordCount.toLocaleString()}
        </li>
        <li>
          <strong>Characters:</strong> {stats.characterCount.toLocaleString()}
        </li>
        <li>
          <strong>Paragraphs:</strong> {stats.paragraphCount}
        </li>
        <li>
          <strong>Sentences:</strong> {stats.sentenceCount}
        </li>
        <li>
          <strong>Avg. Words/Sentence:</strong> {stats.averageWordsPerSentence}
        </li>
        <li>
          <strong>Reading Time:</strong> {stats.readingTime} min
        </li>
        <li>
          <strong>Length:</strong> {stats.lengthCategory}
        </li>
      </ul>

      {storageQuota && (
        <div className="mt-4">
          <h4 className="text-sm font-semibold mb-1">Storage</h4>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                storageQuota.percentage > 80 ? 'bg-red-500' : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min(storageQuota.percentage, 100)}%` }}
            />
          </div>
          <p className="mt-1 text-xs">
            {Math.round(storageQuota.usage / 1024 / 1024)}MB of{' '}
            {Math.round(storageQuota.quota / 1024 / 1024)}MB used
          </p>
        </div>
      )}
    </aside>
  );
};

export default WritingStats;
