/**
 * Session utilities for analytics and cleanup
 *
 * Optional utilities for advanced session management.
 * Can be integrated into EnhancedWritingPanel or run as maintenance tasks.
 */

interface WritingSession {
  date: string;
  wordCount: number;
  duration?: number;
  startWords?: number;
  endWords?: number;
  startedAt?: string;
}

/**
 * Merge consecutive sessions within a time threshold
 *
 * Combines sessions that are less than `thresholdMinutes` apart
 * to create cleaner analytics averages.
 *
 * @param sessions - Array of writing sessions
 * @param thresholdMinutes - Max gap between sessions to merge (default: 2 minutes)
 * @returns Merged sessions array
 *
 * @example
 * const sessions = [
 *   { date: '2025-11-10', wordCount: 100, startedAt: '10:00:00' },
 *   { date: '2025-11-10', wordCount: 150, startedAt: '10:01:00' }, // < 2 min
 *   { date: '2025-11-10', wordCount: 200, startedAt: '10:15:00' }, // > 2 min
 * ];
 * const merged = mergeConsecutiveSessions(sessions, 2);
 * // Result: 2 sessions (first two merged, third separate)
 */
export function mergeConsecutiveSessions(
  sessions: WritingSession[],
  thresholdMinutes = 2,
): WritingSession[] {
  if (sessions.length <= 1) return sessions;

  // Sort by date and time
  const sorted = [...sessions].sort((a, b) => {
    const dateA = new Date(a.startedAt || a.date).getTime();
    const dateB = new Date(b.startedAt || b.date).getTime();
    return dateA - dateB;
  });

  const merged: WritingSession[] = [];
  let current = { ...sorted[0] };

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const next = sorted[i];

    if (!prev || !next) continue;

    const prevTime = new Date(prev.startedAt || prev.date).getTime();
    const nextTime = new Date(next.startedAt || next.date).getTime();
    const gapMinutes = (nextTime - prevTime) / (1000 * 60);

    if (gapMinutes <= thresholdMinutes && prev.date === next.date) {
      // Merge sessions
      current.wordCount = (current.wordCount || 0) + (next.wordCount || 0);
      current.duration = (current.duration || 0) + (next.duration || 0);
      current.endWords = next.endWords || current.endWords;
    } else {
      // Save current and start new
      if (current.date && current.wordCount !== undefined) {
        merged.push(current as WritingSession);
      }
      current = { ...next };
    }
  }

  // Add final session
  if (current.date && current.wordCount !== undefined) {
    merged.push(current as WritingSession);
  }

  return merged;
}

/**
 * Archive old sessions to reduce localStorage size
 *
 * Moves sessions older than `daysToKeep` to a compressed archive.
 * Useful for long-running projects with extensive session history.
 *
 * @param sessions - Array of writing sessions
 * @param daysToKeep - Number of days of session history to keep (default: 90)
 * @returns Object with active and archived sessions
 */
export function archiveOldSessions(
  sessions: WritingSession[],
  daysToKeep = 90,
): {
  active: WritingSession[];
  archived: WritingSession[];
} {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  const cutoffStr = cutoffDate.toISOString().split('T')[0] || '';

  if (!cutoffStr) {
    return { active: sessions, archived: [] };
  }

  const active = sessions.filter((s) => s.date >= cutoffStr);
  const archived = sessions.filter((s) => s.date < cutoffStr);

  return { active, archived };
}

/**
 * Calculate session statistics for telemetry
 *
 * Computes lightweight metrics for analytics dashboard
 * without requiring full session data.
 *
 * @param sessions - Array of writing sessions
 * @returns Session statistics
 */
export function calculateSessionStats(sessions: WritingSession[]): {
  totalSessions: number;
  totalWords: number;
  totalDuration: number;
  avgWordsPerSession: number;
  avgDurationPerSession: number;
  avgWordsPerMinute: number;
  daysWithSessions: number;
  longestSession?: WritingSession;
  mostProductiveDay?: { date: string; words: number };
} {
  if (sessions.length === 0) {
    return {
      totalSessions: 0,
      totalWords: 0,
      totalDuration: 0,
      avgWordsPerSession: 0,
      avgDurationPerSession: 0,
      avgWordsPerMinute: 0,
      daysWithSessions: 0,
    };
  }

  const totalWords = sessions.reduce((sum, s) => sum + s.wordCount, 0);
  const totalDuration = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
  const daysWithSessions = new Set(sessions.map((s) => s.date)).size;

  const longestSession = sessions.reduce((longest, s) =>
    (s.duration || 0) > (longest.duration || 0) ? s : longest,
  );

  // Find most productive day
  const dayTotals = sessions.reduce(
    (acc, s) => {
      acc[s.date] = (acc[s.date] || 0) + s.wordCount;
      return acc;
    },
    {} as Record<string, number>,
  );

  const mostProductiveDay = Object.entries(dayTotals).reduce(
    (max, [date, words]) => (words > max.words ? { date, words } : max),
    { date: '', words: 0 },
  );

  return {
    totalSessions: sessions.length,
    totalWords,
    totalDuration,
    avgWordsPerSession: Math.round(totalWords / sessions.length),
    avgDurationPerSession: Math.round(totalDuration / sessions.length),
    avgWordsPerMinute: totalDuration > 0 ? Math.round(totalWords / totalDuration) : 0,
    daysWithSessions,
    longestSession,
    mostProductiveDay: mostProductiveDay.words > 0 ? mostProductiveDay : undefined,
  };
}

/**
 * Clean up session data for a project
 *
 * Removes duplicate sessions and invalid entries.
 * Useful for maintenance or data corruption recovery.
 *
 * @param projectId - Project ID
 * @returns Cleaned sessions array
 */
export function cleanupSessions(projectId: string): WritingSession[] {
  const key = `sessions-${projectId}`;
  const raw = localStorage.getItem(key);

  if (!raw) return [];

  try {
    const sessions: WritingSession[] = JSON.parse(raw);

    // Remove invalid sessions
    const valid = sessions.filter(
      (s) =>
        typeof s.date === 'string' &&
        typeof s.wordCount === 'number' &&
        s.wordCount >= 0 &&
        /^\d{4}-\d{2}-\d{2}$/.test(s.date),
    );

    // Remove duplicates (keep highest wordCount for same date)
    const deduplicated = valid.reduce((acc, session) => {
      const existing = acc.find((s) => s.date === session.date);
      if (!existing) {
        acc.push(session);
      } else if (session.wordCount > existing.wordCount) {
        // Replace with higher word count
        const index = acc.indexOf(existing);
        acc[index] = session;
      }
      return acc;
    }, [] as WritingSession[]);

    // Sort by date (newest first)
    const sorted = deduplicated.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    // Save cleaned data
    localStorage.setItem(key, JSON.stringify(sorted));

    return sorted;
  } catch (error) {
    console.error('[sessionUtils] Error cleaning sessions:', error);
    return [];
  }
}

/**
 * Check localStorage usage and warn if approaching limits
 *
 * Most browsers limit localStorage to 5-10 MB per origin.
 * This function helps monitor usage and prevent quota errors.
 *
 * @returns Storage usage information
 */
export function checkStorageUsage(): {
  totalBytes: number;
  totalMB: number;
  percentage: number;
  warning: boolean;
  items: Array<{ key: string; bytes: number }>;
} {
  let totalBytes = 0;
  const items: Array<{ key: string; bytes: number }> = [];

  for (const key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      const bytes = (localStorage[key].length + key.length) * 2; // UTF-16
      totalBytes += bytes;
      items.push({ key, bytes });
    }
  }

  const limitBytes = 5 * 1024 * 1024; // 5 MB typical limit
  const totalMB = totalBytes / (1024 * 1024);
  const percentage = (totalBytes / limitBytes) * 100;
  const warning = percentage > 80;

  return {
    totalBytes,
    totalMB: parseFloat(totalMB.toFixed(2)),
    percentage: parseFloat(percentage.toFixed(1)),
    warning,
    items: items.sort((a, b) => b.bytes - a.bytes), // Largest first
  };
}
