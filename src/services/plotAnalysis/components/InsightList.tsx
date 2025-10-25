// Insight List - Display actionable insights with filtering

import { AlertCircle, AlertTriangle, Info } from 'lucide-react';

import type { Severity } from '../types';
import type { InsightListProps, SeverityFilter } from '../types.ui';

function getSeverityIcon(severity: Severity) {
  switch (severity) {
    case 'high':
      return <AlertCircle className="text-red-600" size={20} />;
    case 'med':
      return <AlertTriangle className="text-yellow-600" size={20} />;
    case 'low':
      return <Info className="text-blue-600" size={20} />;
  }
}

function getSeverityBadge(severity: Severity) {
  const styles = {
    high: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400',
    med: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400',
    low: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400',
  };

  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${styles[severity]}`}>
      {severity.toUpperCase()}
    </span>
  );
}

const filterOptions: Array<{ value: SeverityFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'high', label: 'High' },
  { value: 'med', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

export function InsightList({ insights, filter, onFilterChange, onOpenChapter }: InsightListProps) {
  const filteredInsights =
    filter === 'all' ? insights : insights.filter((i) => i.severity === filter);

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-text-1">
          Insights {filteredInsights.length > 0 && `(${filteredInsights.length})`}
        </h3>
        <div className="flex gap-2">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onFilterChange(option.value)}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                filter === option.value
                  ? 'bg-ink-500 text-white'
                  : 'bg-surface-2 text-text-2 hover:bg-ink-50'
              }`}
              aria-pressed={filter === option.value}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Insights list */}
      {filteredInsights.length === 0 ? (
        <div className="text-center py-8 text-text-2">
          {insights.length === 0
            ? 'No insights found. Your plot structure looks solid!'
            : `No ${filter} severity insights found.`}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredInsights.map((insight) => (
            <div
              key={insight.id}
              className="rounded-lg border border-subtle bg-surface-1 p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">{getSeverityIcon(insight.severity)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    {getSeverityBadge(insight.severity)}
                    {insight.affectedChapters.length > 0 && (
                      <span className="text-xs text-text-2">
                        Affects {insight.affectedChapters.length} chapter
                        {insight.affectedChapters.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-text-1 font-medium mb-1">{insight.finding}</p>
                  <p className="text-sm text-text-2 mb-3">{insight.suggestion}</p>

                  {/* Affected chapters */}
                  {insight.affectedChapters.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {insight.affectedChapters.slice(0, 5).map((chapterIdx) => (
                        <button
                          key={chapterIdx}
                          onClick={() => onOpenChapter(chapterIdx)}
                          className="px-2 py-1 text-xs rounded bg-ink-50 text-ink-700 hover:bg-ink-100 transition-colors border border-ink-200"
                          aria-label={`Open chapter ${chapterIdx + 1}`}
                        >
                          Ch {chapterIdx + 1}
                        </button>
                      ))}
                      {insight.affectedChapters.length > 5 && (
                        <span className="px-2 py-1 text-xs text-text-2">
                          +{insight.affectedChapters.length - 5} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
