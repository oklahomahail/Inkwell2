/**
 * Combined analytics hook for Dashboard & Analytics panels
 * Integrates chapter statistics with writing sessions
 */

import { useMemo } from 'react';

import { useChapterWordTotals } from '@/context/ChaptersContext';

interface WritingSession {
  date: string;
  wordCount: number;
  duration?: number;
  startWords?: number;
  endWords?: number;
  startedAt?: string;
}

interface ProjectAnalytics {
  totals: {
    totalWords: number;
    daysWithWriting: number;
    dailyAvg: number;
    streak: number;
  };
  chapters: {
    chapterCount: number;
    chapterWords: number;
    avgWordsPerChapter: number;
    longestChapter?: {
      id: string;
      title: string;
      wordCount: number;
    };
  };
  notice?: string;
  sessions: WritingSession[];
}

/**
 * Calculate writing streak from sessions
 */
function calcStreak(sessions: WritingSession[]): number {
  if (sessions.length === 0) return 0;

  const sortedDates = sessions
    .map((s) => new Date(s.date || s.startedAt || Date.now()).toDateString())
    .filter((d, i, arr) => arr.indexOf(d) === i) // unique dates
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  let streak = 0;
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  // Start counting from today or yesterday
  let currentDate =
    sortedDates[0] === today || sortedDates[0] === yesterday
      ? new Date(sortedDates[0])
      : new Date(yesterday);

  for (const dateStr of sortedDates) {
    const sessionDate = new Date(dateStr);
    const diffDays = Math.round((currentDate.getTime() - sessionDate.getTime()) / 86400000);

    if (diffDays === 0) {
      streak++;
      currentDate = new Date(currentDate.getTime() - 86400000);
    } else if (diffDays === 1) {
      streak++;
      currentDate = sessionDate;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Main analytics hook - combines chapter stats with writing sessions
 */
export function useProjectAnalytics(projectId: string): ProjectAnalytics {
  const chapterStats = useChapterWordTotals(projectId);

  const sessions = useMemo(() => {
    const savedSessions = localStorage.getItem(`sessions-${projectId}`);
    if (!savedSessions) return [];

    try {
      const parsed: WritingSession[] = JSON.parse(savedSessions);
      return parsed.filter((s) => typeof s.date === 'string' && typeof s.wordCount === 'number');
    } catch {
      return [];
    }
  }, [projectId]);

  return useMemo(() => {
    // Session-derived totals (words written over time)
    const sessionTotal = sessions.reduce((n, s) => {
      const wordsWritten = Math.max(
        0,
        (s.endWords ?? s.wordCount ?? s.startWords ?? 0) - (s.startWords ?? 0),
      );
      return n + wordsWritten;
    }, 0);

    const daysWithWriting = new Set(
      sessions.map((s) => new Date(s.date || s.startedAt || Date.now()).toDateString()),
    ).size;

    const dailyAvg = daysWithWriting > 0 ? Math.round(sessionTotal / daysWithWriting) : 0;
    const streak = calcStreak(sessions);

    // Fallback: if no sessions yet, show chapter totals so the page isn't empty
    const totalWords = sessions.length > 0 ? sessionTotal : chapterStats.total;
    const notice =
      sessions.length === 0 && chapterStats.total > 0
        ? 'Showing current manuscript totals (no sessions recorded yet)'
        : undefined;

    return {
      totals: {
        totalWords,
        daysWithWriting,
        dailyAvg,
        streak,
      },
      chapters: {
        chapterCount: chapterStats.count,
        chapterWords: chapterStats.total,
        avgWordsPerChapter: chapterStats.avg,
        longestChapter: chapterStats.longest,
      },
      notice,
      sessions,
    };
  }, [sessions, chapterStats]);
}
