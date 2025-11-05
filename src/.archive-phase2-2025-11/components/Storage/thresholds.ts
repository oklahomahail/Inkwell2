/**
 * Storage severity thresholds and color mapping
 * Provides consistent color theming across storage-related components
 */

export type StorageLevel = 'ok' | 'warn' | 'high' | 'crit';
export type StorageTone = 'success' | 'warning' | 'amber' | 'destructive';

export interface StorageSeverity {
  level: StorageLevel;
  tone: StorageTone;
}

/**
 * Calculate storage severity based on usage percentage
 * @param usedPct - Percentage of storage used (0-100)
 * @returns Severity level and tone for UI theming
 */
export function storageSeverity(usedPct: number): StorageSeverity {
  if (usedPct < 60) {
    return { level: 'ok', tone: 'success' }; // green
  }
  if (usedPct < 80) {
    return { level: 'warn', tone: 'warning' }; // yellow
  }
  if (usedPct < 90) {
    return { level: 'high', tone: 'amber' }; // orange
  }
  return { level: 'crit', tone: 'destructive' }; // red
}

/**
 * Get Tailwind CSS classes for a given storage tone
 */
export function getStorageClasses(tone: StorageTone): {
  bg: string;
  text: string;
  border: string;
} {
  switch (tone) {
    case 'success':
      return {
        bg: 'bg-green-50 dark:bg-green-900/20',
        text: 'text-green-700 dark:text-green-300',
        border: 'border-green-200 dark:border-green-800',
      };
    case 'warning':
      return {
        bg: 'bg-yellow-50 dark:bg-yellow-900/20',
        text: 'text-yellow-700 dark:text-yellow-300',
        border: 'border-yellow-200 dark:border-yellow-800',
      };
    case 'amber':
      return {
        bg: 'bg-orange-50 dark:bg-orange-900/20',
        text: 'text-orange-700 dark:text-orange-300',
        border: 'border-orange-200 dark:border-orange-800',
      };
    case 'destructive':
      return {
        bg: 'bg-red-50 dark:bg-red-900/20',
        text: 'text-red-700 dark:text-red-300',
        border: 'border-red-200 dark:border-red-800',
      };
  }
}
