import { getUsageSeverity } from '@/utils/storage/storageHealth';

export function StorageBadge({
  persisted,
  usedPercent,
}: {
  persisted: boolean;
  usedPercent: number;
}) {
  const sev = getUsageSeverity(usedPercent);

  const severityColors = {
    ok: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      text: 'text-green-700 dark:text-green-400',
      dot: 'bg-green-500',
    },
    warn: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      text: 'text-yellow-700 dark:text-yellow-400',
      dot: 'bg-yellow-500',
    },
    high: {
      bg: 'bg-orange-50 dark:bg-orange-900/20',
      text: 'text-orange-700 dark:text-orange-400',
      dot: 'bg-orange-500',
    },
    critical: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      text: 'text-red-700 dark:text-red-400',
      dot: 'bg-red-500',
    },
  };

  const color = severityColors[sev];

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm ${color.bg} ${color.text}`}
    >
      <span className={`h-2 w-2 rounded-full ${color.dot}`} />
      <span>Storage {sev === 'ok' ? 'healthy' : 'warning'}</span>
      <span className="text-slate-500 dark:text-slate-400">
        • {persisted ? 'Persisted' : 'Not persisted'} • {Math.round(usedPercent)}%
      </span>
    </span>
  );
}
