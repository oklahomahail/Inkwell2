/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useProjectAnalytics } from '../useProjectAnalytics';
import type { ChapterMeta } from '@/types/writing';

// Mock dependencies
vi.mock('@/context/ChaptersContext', () => ({
  useChapterWordTotals: vi.fn(),
}));

describe('useProjectAnalytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Word Totals', () => {
    it('should return accurate word totals from chapters', () => {
      vi.mocked(require('@/context/ChaptersContext').useChapterWordTotals).mockReturnValue({
        total: 2500,
        count: 5,
        avg: 500,
        longest: {
          id: 'ch3',
          title: 'Chapter 3',
          wordCount: 800,
        } as ChapterMeta,
      });

      const { result } = renderHook(() => useProjectAnalytics('test-project'));

      expect(result.current.chapters.chapterWords).toBe(2500);
      expect(result.current.chapters.chapterCount).toBe(5);
      expect(result.current.chapters.avgWordsPerChapter).toBe(500);
    });

    it('should handle zero chapters', () => {
      vi.mocked(require('@/context/ChaptersContext').useChapterWordTotals).mockReturnValue({
        total: 0,
        count: 0,
        avg: 0,
        longest: undefined,
      });

      const { result } = renderHook(() => useProjectAnalytics('test-project'));

      expect(result.current.chapters.chapterCount).toBe(0);
      expect(result.current.chapters.chapterWords).toBe(0);
      expect(result.current.chapters.avgWordsPerChapter).toBe(0);
      expect(result.current.chapters.longestChapter).toBeUndefined();
    });

    it('should compute longest chapter correctly', () => {
      const longestChapter = {
        id: 'ch-long',
        title: 'Epic Chapter',
        wordCount: 2000,
        projectId: 'test-project',
        index: 0,
        status: 'draft' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      vi.mocked(require('@/context/ChaptersContext').useChapterWordTotals).mockReturnValue({
        total: 3500,
        count: 3,
        avg: 1166,
        longest: longestChapter,
      });

      const { result } = renderHook(() => useProjectAnalytics('test-project'));

      expect(result.current.chapters.longestChapter).toEqual({
        id: 'ch-long',
        title: 'Epic Chapter',
        wordCount: 2000,
      });
    });
  });

  describe('Writing Sessions', () => {
    it('should load sessions from localStorage', () => {
      const sessions = [
        {
          date: '2025-01-01',
          wordCount: 500,
          startWords: 0,
          endWords: 500,
        },
        {
          date: '2025-01-02',
          wordCount: 300,
          startWords: 500,
          endWords: 800,
        },
      ];

      localStorage.setItem('sessions-test-project', JSON.stringify(sessions));

      vi.mocked(require('@/context/ChaptersContext').useChapterWordTotals).mockReturnValue({
        total: 800,
        count: 1,
        avg: 800,
        longest: undefined,
      });

      const { result } = renderHook(() => useProjectAnalytics('test-project'));

      expect(result.current.sessions).toHaveLength(2);
      expect(result.current.totals.daysWithWriting).toBe(2);
    });

    it('should handle missing sessions', () => {
      vi.mocked(require('@/context/ChaptersContext').useChapterWordTotals).mockReturnValue({
        total: 500,
        count: 1,
        avg: 500,
        longest: undefined,
      });

      const { result } = renderHook(() => useProjectAnalytics('test-project'));

      expect(result.current.sessions).toEqual([]);
      expect(result.current.totals.daysWithWriting).toBe(0);
    });

    it('should handle corrupted localStorage data', () => {
      localStorage.setItem('sessions-test-project', 'invalid json{');

      vi.mocked(require('@/context/ChaptersContext').useChapterWordTotals).mockReturnValue({
        total: 500,
        count: 1,
        avg: 500,
        longest: undefined,
      });

      const { result } = renderHook(() => useProjectAnalytics('test-project'));

      expect(result.current.sessions).toEqual([]);
    });

    it('should filter invalid session entries', () => {
      const sessions = [
        { date: '2025-01-01', wordCount: 500 }, // valid
        { date: 123, wordCount: 300 }, // invalid date
        { date: '2025-01-03', wordCount: 'abc' }, // invalid wordCount
        { date: '2025-01-04', wordCount: 200 }, // valid
      ];

      localStorage.setItem('sessions-test-project', JSON.stringify(sessions));

      vi.mocked(require('@/context/ChaptersContext').useChapterWordTotals).mockReturnValue({
        total: 700,
        count: 1,
        avg: 700,
        longest: undefined,
      });

      const { result } = renderHook(() => useProjectAnalytics('test-project'));

      expect(result.current.sessions).toHaveLength(2);
    });
  });

  describe('Derived Metrics', () => {
    it('should calculate daily average correctly', () => {
      const sessions = [
        { date: '2025-01-01', wordCount: 500, startWords: 0, endWords: 500 },
        { date: '2025-01-02', wordCount: 300, startWords: 500, endWords: 800 },
        { date: '2025-01-03', wordCount: 200, startWords: 800, endWords: 1000 },
      ];

      localStorage.setItem('sessions-test-project', JSON.stringify(sessions));

      vi.mocked(require('@/context/ChaptersContext').useChapterWordTotals).mockReturnValue({
        total: 1000,
        count: 1,
        avg: 1000,
        longest: undefined,
      });

      const { result } = renderHook(() => useProjectAnalytics('test-project'));

      // Total: 500 + 300 + 200 = 1000
      // Days: 3
      // Average: 1000 / 3 = 333.33 rounded to 333
      expect(result.current.totals.dailyAvg).toBe(333);
    });

    it('should calculate streak correctly', () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const twoDaysAgo = new Date(today);
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      const sessions = [
        { date: today.toISOString(), wordCount: 100 },
        { date: yesterday.toISOString(), wordCount: 200 },
        { date: twoDaysAgo.toISOString(), wordCount: 150 },
      ];

      localStorage.setItem('sessions-test-project', JSON.stringify(sessions));

      vi.mocked(require('@/context/ChaptersContext').useChapterWordTotals).mockReturnValue({
        total: 450,
        count: 1,
        avg: 450,
        longest: undefined,
      });

      const { result } = renderHook(() => useProjectAnalytics('test-project'));

      expect(result.current.totals.streak).toBe(3);
    });

    it('should break streak on gap', () => {
      const today = new Date();
      const threeDaysAgo = new Date(today);
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      const sessions = [
        { date: today.toISOString(), wordCount: 100 },
        { date: threeDaysAgo.toISOString(), wordCount: 200 },
      ];

      localStorage.setItem('sessions-test-project', JSON.stringify(sessions));

      vi.mocked(require('@/context/ChaptersContext').useChapterWordTotals).mockReturnValue({
        total: 300,
        count: 1,
        avg: 300,
        longest: undefined,
      });

      const { result } = renderHook(() => useProjectAnalytics('test-project'));

      expect(result.current.totals.streak).toBe(1);
    });

    it('should return zero streak when no sessions', () => {
      vi.mocked(require('@/context/ChaptersContext').useChapterWordTotals).mockReturnValue({
        total: 0,
        count: 0,
        avg: 0,
        longest: undefined,
      });

      const { result } = renderHook(() => useProjectAnalytics('test-project'));

      expect(result.current.totals.streak).toBe(0);
    });
  });

  describe('Fallback Behavior', () => {
    it('should use chapter totals when no sessions exist', () => {
      vi.mocked(require('@/context/ChaptersContext').useChapterWordTotals).mockReturnValue({
        total: 1500,
        count: 3,
        avg: 500,
        longest: undefined,
      });

      const { result } = renderHook(() => useProjectAnalytics('test-project'));

      expect(result.current.totals.totalWords).toBe(1500);
      expect(result.current.notice).toBe(
        'Showing current manuscript totals (no sessions recorded yet)',
      );
    });

    it('should prioritize session totals over chapter totals', () => {
      const sessions = [{ date: '2025-01-01', wordCount: 500, startWords: 0, endWords: 500 }];

      localStorage.setItem('sessions-test-project', JSON.stringify(sessions));

      vi.mocked(require('@/context/ChaptersContext').useChapterWordTotals).mockReturnValue({
        total: 2000, // Different from session total
        count: 2,
        avg: 1000,
        longest: undefined,
      });

      const { result } = renderHook(() => useProjectAnalytics('test-project'));

      expect(result.current.totals.totalWords).toBe(500);
      expect(result.current.notice).toBeUndefined();
    });

    it('should not show notice when sessions exist', () => {
      const sessions = [{ date: '2025-01-01', wordCount: 100, startWords: 0, endWords: 100 }];

      localStorage.setItem('sessions-test-project', JSON.stringify(sessions));

      vi.mocked(require('@/context/ChaptersContext').useChapterWordTotals).mockReturnValue({
        total: 100,
        count: 1,
        avg: 100,
        longest: undefined,
      });

      const { result } = renderHook(() => useProjectAnalytics('test-project'));

      expect(result.current.notice).toBeUndefined();
    });
  });

  describe('Live Updates', () => {
    it('should recompute when chapters change', () => {
      const mockChapterTotals = vi.mocked(
        require('@/context/ChaptersContext').useChapterWordTotals,
      );

      mockChapterTotals.mockReturnValue({
        total: 1000,
        count: 2,
        avg: 500,
        longest: undefined,
      });

      const { result, rerender } = renderHook(() => useProjectAnalytics('test-project'));

      expect(result.current.chapters.chapterWords).toBe(1000);

      // Simulate chapter update
      mockChapterTotals.mockReturnValue({
        total: 1500,
        count: 2,
        avg: 750,
        longest: undefined,
      });

      rerender();

      expect(result.current.chapters.chapterWords).toBe(1500);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large word counts', () => {
      vi.mocked(require('@/context/ChaptersContext').useChapterWordTotals).mockReturnValue({
        total: 1000000,
        count: 100,
        avg: 10000,
        longest: {
          id: 'ch-long',
          title: 'Epic Novel',
          wordCount: 50000,
        } as ChapterMeta,
      });

      const { result } = renderHook(() => useProjectAnalytics('test-project'));

      expect(result.current.chapters.chapterWords).toBe(1000000);
      expect(result.current.chapters.longestChapter?.wordCount).toBe(50000);
    });

    it('should handle negative word counts gracefully', () => {
      const sessions = [
        {
          date: '2025-01-01',
          wordCount: -100, // invalid
          startWords: 100,
          endWords: 0,
        },
      ];

      localStorage.setItem('sessions-test-project', JSON.stringify(sessions));

      vi.mocked(require('@/context/ChaptersContext').useChapterWordTotals).mockReturnValue({
        total: 0,
        count: 0,
        avg: 0,
        longest: undefined,
      });

      const { result } = renderHook(() => useProjectAnalytics('test-project'));

      // Should use max(0, wordsWritten)
      expect(result.current.totals.totalWords).toBe(0);
    });
  });
});
