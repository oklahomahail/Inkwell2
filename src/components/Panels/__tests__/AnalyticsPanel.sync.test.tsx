/**
 * @vitest-environment jsdom
 *
 * Analytics Panel Live Sync Tests
 * Tests the 3-second polling mechanism that keeps analytics updated
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import type { ChapterMeta } from '@/types/writing';

const mockDispatch = vi.fn();
const mockChaptersList = vi.fn();

// Mock all dependencies
vi.mock('@/context/AppContext', () => ({
  useAppContext: vi.fn(() => ({
    state: { currentProjectId: 'test-project' },
    currentProject: { id: 'test-project', name: 'Test Project' },
    dispatch: vi.fn(),
  })),
}));

vi.mock('@/context/ChaptersContext', () => ({
  useChapters: vi.fn(() => ({
    dispatch: mockDispatch,
    state: { byId: {}, byProject: {} },
    getChapterList: vi.fn(() => []),
    getActiveChapter: vi.fn(),
  })),
}));

vi.mock('@/hooks/useProjectAnalytics', () => ({
  useProjectAnalytics: vi.fn(() => ({
    totals: {
      totalWords: 1500,
      daysWithWriting: 5,
      dailyAvg: 300,
      streak: 3,
    },
    chapters: {
      chapterCount: 3,
      chapterWords: 1500,
      avgWordsPerChapter: 500,
    },
    sessions: [],
  })),
}));

vi.mock('@/components/Analytics/WritingAnalyticsView', () => ({
  default: () => <div>Advanced Analytics View</div>,
}));

vi.mock('@/utils/tourTriggers', () => ({
  triggerAnalyticsVisited: vi.fn(),
}));

vi.mock('@/services/chaptersService', () => ({
  Chapters: {
    list: mockChaptersList,
  },
}));

// Import component after mocks
const { default: AnalyticsPanel } = await import('../AnalyticsPanel');

describe('AnalyticsPanel - Live Sync', () => {
  const sampleChapters: ChapterMeta[] = [
    {
      id: 'ch1',
      projectId: 'test-project',
      title: 'Chapter 1',
      wordCount: 500,
      index: 0,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'ch2',
      projectId: 'test-project',
      title: 'Chapter 2',
      wordCount: 800,
      index: 1,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    mockChaptersList.mockResolvedValue(sampleChapters);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Initial Load', () => {
    it('should load chapters immediately on mount', async () => {
      render(<AnalyticsPanel />);

      await waitFor(() => {
        expect(mockChaptersList).toHaveBeenCalledWith('test-project');
      });
    });

    it('should dispatch LOAD_FOR_PROJECT action', async () => {
      render(<AnalyticsPanel />);

      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'LOAD_FOR_PROJECT',
            payload: expect.objectContaining({
              projectId: 'test-project',
              chapters: sampleChapters,
            }),
          }),
        );
      });
    });
  });

  describe('Polling Mechanism', () => {
    it('should poll every 3 seconds', async () => {
      render(<AnalyticsPanel />);

      // Initial load
      await waitFor(() => {
        expect(mockChaptersList).toHaveBeenCalledTimes(1);
      });

      // First poll at 3s
      await vi.advanceTimersByTimeAsync(3000);
      expect(mockChaptersList).toHaveBeenCalledTimes(2);

      // Second poll at 6s
      await vi.advanceTimersByTimeAsync(3000);
      expect(mockChaptersList).toHaveBeenCalledTimes(3);
    });

    it('should dispatch on each poll', async () => {
      render(<AnalyticsPanel />);

      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalledTimes(1);
      });

      await vi.advanceTimersByTimeAsync(3000);
      expect(mockDispatch).toHaveBeenCalledTimes(2);

      await vi.advanceTimersByTimeAsync(3000);
      expect(mockDispatch).toHaveBeenCalledTimes(3);
    });

    it('should clear interval on unmount', async () => {
      const { unmount } = render(<AnalyticsPanel />);

      await waitFor(() => {
        expect(mockChaptersList).toHaveBeenCalledTimes(1);
      });

      unmount();

      // Advance time after unmount - should not poll
      await vi.advanceTimersByTimeAsync(6000);
      expect(mockChaptersList).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle IndexedDB errors gracefully', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockChaptersList.mockRejectedValueOnce(new Error('IndexedDB error'));

      render(<AnalyticsPanel />);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          '[AnalyticsPanel] Failed to load chapters:',
          expect.any(Error),
        );
      });

      consoleError.mockRestore();
    });

    it('should continue polling after errors', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      // First call fails, subsequent succeed
      mockChaptersList.mockRejectedValueOnce(new Error('Error')).mockResolvedValue(sampleChapters);

      render(<AnalyticsPanel />);

      await waitFor(() => {
        expect(mockChaptersList).toHaveBeenCalledTimes(1);
      });

      // Should retry on next poll
      await vi.advanceTimersByTimeAsync(3000);
      expect(mockChaptersList).toHaveBeenCalledTimes(2);

      consoleError.mockRestore();
    });
  });

  describe('Data Flow', () => {
    it('should pass correct projectId to Chapters.list', async () => {
      render(<AnalyticsPanel />);

      await waitFor(() => {
        expect(mockChaptersList).toHaveBeenCalledWith('test-project');
      });
    });

    it('should update ChaptersContext with fresh data', async () => {
      const updatedChapters: ChapterMeta[] = [
        ...sampleChapters,
        {
          id: 'ch3',
          projectId: 'test-project',
          title: 'Chapter 3',
          wordCount: 1000,
          index: 2,
          status: 'draft',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      mockChaptersList.mockResolvedValueOnce(sampleChapters).mockResolvedValueOnce(updatedChapters);

      render(<AnalyticsPanel />);

      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalledWith(
          expect.objectContaining({
            payload: expect.objectContaining({
              chapters: sampleChapters,
            }),
          }),
        );
      });

      // Advance to next poll
      await vi.advanceTimersByTimeAsync(3000);

      expect(mockDispatch).toHaveBeenLastCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            chapters: updatedChapters,
          }),
        }),
      );
    });
  });

  describe('Performance', () => {
    it('should not poll when projectId is empty', async () => {
      const { useAppContext } = await import('@/context/AppContext');
      const mockUseAppContext = vi.mocked(useAppContext);

      mockUseAppContext.mockReturnValue({
        state: { currentProjectId: '' },
        currentProject: null,
        dispatch: vi.fn(),
      });

      render(<AnalyticsPanel />);

      expect(mockChaptersList).not.toHaveBeenCalled();
    });
  });
});
