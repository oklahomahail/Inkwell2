// src/features/plotboards/components/SceneStatsPanel.tsx
import { BarChart3, TrendingUp, AlertCircle } from 'lucide-react';
import React from 'react';

import type { SceneType } from '@/types/ai';

import { SceneTypeBadge } from './SceneTypeBadge';

export interface SceneStats {
  total: number;
  byType: Record<SceneType, number>;
  percentages: Record<SceneType, number>;
}

interface SceneStatsPanelProps {
  stats: SceneStats | null;
  isLoading?: boolean;
  onTypeClick?: (type: SceneType) => void;
}

export const SceneStatsPanel: React.FC<SceneStatsPanelProps> = ({
  stats,
  isLoading = false,
  onTypeClick,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Scene Mix</h3>
        </div>
        <div className="space-y-2">
          <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
          <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
          <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (!stats || stats.total === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Scene Mix</h3>
        </div>
        <div className="flex items-start gap-2 text-sm text-gray-500 dark:text-gray-400">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p>No classified scenes yet. Classify your chapters to see the scene distribution.</p>
        </div>
      </div>
    );
  }

  // Sort by count (descending)
  const sortedTypes = (Object.keys(stats.byType) as SceneType[])
    .filter((type) => stats.byType[type] > 0)
    .sort((a, b) => stats.byType[b] - stats.byType[a]);

  // Calculate insights
  const dominantType = sortedTypes[0];
  const dominantPercent = dominantType ? stats.percentages[dominantType] : 0;
  const hasImbalance = dominantPercent > 40; // More than 40% is one type

  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Scene Mix</h3>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">{stats.total} scenes</span>
      </div>

      {/* Stats List */}
      <div className="space-y-2 mb-4">
        {sortedTypes.map((type) => {
          const count = stats.byType[type];
          const percentage = stats.percentages[type];

          return (
            <button
              key={type}
              onClick={() => onTypeClick?.(type)}
              className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
                onTypeClick
                  ? 'hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer'
                  : 'cursor-default'
              }`}
            >
              <SceneTypeBadge type={type} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {count} scene{count !== 1 ? 's' : ''}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {percentage.toFixed(0)}%
                  </span>
                </div>
                {/* Progress bar */}
                <div className="w-full h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500 dark:bg-primary-400 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Insight */}
      {hasImbalance && dominantType && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <TrendingUp className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 dark:text-amber-300">
            <strong>{dominantPercent.toFixed(0)}%</strong> of your scenes are{' '}
            <strong>{dominantType}</strong> scenes. Consider balancing with other scene types for
            variety.
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-slate-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          AI-powered scene classification
        </p>
      </div>
    </div>
  );
};
