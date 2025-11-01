/**
 * Export Stats Component (v0.7.0)
 *
 * Displays summary statistics for export history:
 * - Total exports
 * - Last export time
 * - Last export word count
 * - Average duration
 */

import { FileDown, Clock, FileText, TrendingUp } from 'lucide-react';
import React from 'react';

import type { ExportHistoryStats } from '@/types/export';

interface ExportStatsProps {
  stats: ExportHistoryStats;
  loading?: boolean;
}

export function ExportStats({ stats, loading = false }: ExportStatsProps) {
  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatTimeAgo = (isoDate: string | null): string => {
    if (!isoDate) return '—';

    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 animate-pulse"
          >
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-3" />
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32" />
          </div>
        ))}
      </div>
    );
  }

  const tiles = [
    {
      icon: FileDown,
      label: 'Total Exports',
      value: stats.totalExports.toLocaleString(),
      subtitle: `${stats.successfulExports} successful, ${stats.failedExports} failed`,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      icon: Clock,
      label: 'Last Export',
      value: formatTimeAgo(stats.lastExportTime),
      subtitle: stats.lastExportTime
        ? new Date(stats.lastExportTime).toLocaleString()
        : 'No exports yet',
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      icon: FileText,
      label: 'Last Export',
      value: stats.lastExportWordCount.toLocaleString(),
      subtitle: 'words exported',
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    },
    {
      icon: TrendingUp,
      label: 'Avg Duration',
      value: formatDuration(stats.averageDurationMs),
      subtitle: `${stats.totalWordsExported.toLocaleString()} total words`,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {tiles.map((tile, index) => {
        const Icon = tile.icon;
        return (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {tile.label}
              </span>
              <div className={`p-2 rounded-lg ${tile.bgColor}`}>
                <Icon className={`w-4 h-4 ${tile.color}`} />
              </div>
            </div>
            <div className={`text-2xl font-bold ${tile.color} mb-1`}>{tile.value}</div>
            <div className="text-xs text-gray-500 dark:text-gray-500">{tile.subtitle}</div>
          </div>
        );
      })}
    </div>
  );
}
