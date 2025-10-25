// Scorecard Summary - Grade display with metrics

import { RefreshCw } from 'lucide-react';

import type { Grade } from '../types';
import type { ScorecardSummaryProps } from '../types.ui';

function getGradeColor(grade: Grade): string {
  switch (grade) {
    case 'A':
      return 'text-green-600 dark:text-green-400';
    case 'B':
      return 'text-blue-600 dark:text-blue-400';
    case 'C':
      return 'text-yellow-600 dark:text-yellow-400';
    case 'D':
      return 'text-orange-600 dark:text-orange-400';
    case 'F':
      return 'text-red-600 dark:text-red-400';
  }
}

function formatRelativeTime(timestamp: number | null): string {
  if (!timestamp) return 'Never';

  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
}

interface MetricDialProps {
  label: string;
  value: number;
  max?: number;
}

function MetricDial({ label, value, max = 100 }: MetricDialProps) {
  const percentage = Math.min(100, (value / max) * 100);
  const color =
    percentage >= 80
      ? 'text-green-600'
      : percentage >= 60
        ? 'text-blue-600'
        : percentage >= 40
          ? 'text-yellow-600'
          : 'text-red-600';

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-20 h-20">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
          {/* Background circle */}
          <circle
            cx="18"
            cy="18"
            r="16"
            fill="none"
            stroke="hsl(var(--surface-2))"
            strokeWidth="3"
          />
          {/* Progress circle */}
          <circle
            cx="18"
            cy="18"
            r="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray={`${percentage} ${100 - percentage}`}
            strokeLinecap="round"
            className={color}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-lg font-semibold ${color}`}>{value}</span>
        </div>
      </div>
      <span className="mt-2 text-sm text-text-2">{label}</span>
    </div>
  );
}

export function ScorecardSummary({ scorecard, onRerun, lastAnalyzedAt }: ScorecardSummaryProps) {
  const gradeColor = getGradeColor(scorecard.grade);

  return (
    <div className="rounded-lg border border-subtle bg-surface-1 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-text-1">Plot Analysis</h2>
          <p className="text-sm text-text-2 mt-1">
            Last analyzed: {formatRelativeTime(lastAnalyzedAt ?? null)}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className={`text-5xl font-bold ${gradeColor}`}>{scorecard.grade}</div>
            <div className="text-xs text-text-2 mt-1">Overall Grade</div>
          </div>
          {onRerun && (
            <button
              onClick={onRerun}
              className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg border border-ink-500 text-ink-700 hover:bg-ink-50 transition-colors"
              aria-label="Re-run analysis"
            >
              <RefreshCw size={16} />
              Re-run
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        <MetricDial label="Structure" value={scorecard.structure} />
        <MetricDial label="Pacing" value={scorecard.pacing} />
        <MetricDial label="Purpose" value={scorecard.scenePurpose} />
        <MetricDial label="Coverage" value={scorecard.coverage} />
      </div>
    </div>
  );
}
