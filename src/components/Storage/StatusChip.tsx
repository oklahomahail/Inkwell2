import React from 'react';

import { useStorageHealth } from '@/hooks/useStorageHealth';

type Props = {
  onClick?: () => void;
  className?: string;
};

/**
 * Compact storage status chip that shows health at a glance
 * Click to open detailed storage health modal
 */
export default function StatusChip({ onClick, className }: Props) {
  const report = useStorageHealth();

  // Loading state
  if (!report) {
    return (
      <button
        type="button"
        aria-label="Storage status loading"
        className={`inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-3 py-1 text-sm opacity-80 dark:border-gray-600 dark:bg-gray-800 ${className ?? ''}`}
        onClick={onClick}
      >
        <span className="h-2 w-2 animate-pulse rounded-full bg-gray-400" />
        Checking storage…
      </button>
    );
  }

  const persisted = report.persisted === true;
  const privateMode = report.privateMode === true;
  const quotaPct = report.percentUsed ?? 0;
  const warnings = report.warnings ?? [];

  let dotClass = 'bg-emerald-500';
  let label = 'Local save active';
  let ariaLabel = 'Storage is healthy';

  if (privateMode) {
    dotClass = 'bg-red-500';
    label = 'Private window';
    ariaLabel = 'Private window - data will be deleted';
  } else if (warnings.length > 0) {
    dotClass = 'bg-amber-500';
    label = 'Storage warning';
    ariaLabel = `Storage warning: ${warnings[0]}`;
  } else if (quotaPct >= 80) {
    dotClass = 'bg-amber-500';
    label = 'Storage filling up';
    ariaLabel = `Storage ${Math.round(quotaPct)}% full`;
  } else if (!persisted) {
    dotClass = 'bg-amber-500';
    label = 'Not persisted';
    ariaLabel = 'Storage not persistent - may be cleared';
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-3 py-1 text-sm transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700 ${className ?? ''}`}
      aria-label={`${ariaLabel}. Click for details`}
      title="Click for storage health details"
    >
      <span className={`h-2.5 w-2.5 rounded-full ${dotClass}`} />
      <span className="font-medium text-gray-700 dark:text-gray-200">{label}</span>
      <span className="text-xs text-gray-500 dark:text-gray-400">
        {persisted ? 'Persisted' : 'Ephemeral'}
        {typeof quotaPct === 'number' ? ` • ${Math.round(quotaPct)}%` : ''}
      </span>
    </button>
  );
}
