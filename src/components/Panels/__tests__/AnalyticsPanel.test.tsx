/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import type { ChapterMeta } from '@/types/writing';

const mockDispatch = vi.fn();
const mockChaptersList = vi.fn();
const mockUseProjectAnalytics = vi.fn();
const mockTriggerAnalyticsVisited = vi.fn();

// Mock dependencies
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
  useProjectAnalytics: mockUseProjectAnalytics,
}));

vi.mock('@/components/Analytics/WritingAnalyticsView', () => ({
  default: () => <div>Advanced Analytics View</div>,
}));

vi.mock('@/utils/tourTriggers', () => ({
  triggerAnalyticsVisited: mockTriggerAnalyticsVisited,
}));

vi.mock('@/services/chaptersService', () => ({
  Chapters: {
    list: mockChaptersList,
  },
}));

// Import after mocks
const { default: AnalyticsPanel } = await import('../AnalyticsPanel');

describe('AnalyticsPanel - Live Sync', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();

    // Setup default mock returns
    mockUseProjectAnalytics.mockReturnValue({
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
        longestChapter: {
          id: 'ch1',
          title: 'Chapter 1',
          wordCount: 800,
        },
      },
      sessions: [],
      notice: undefined,
    });

    // Mock Chapters service
    mockChaptersList.mockResolvedValue([
      {
        id: 'ch1',
        projectId: 'test-project',
        title: 'Chapter 1',
        wordCount: 500,
        index: 0,
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as ChapterMeta,
      {
        id: 'ch2',
        projectId: 'test-project',
        title: 'Chapter 2',
        wordCount: 800,
        index: 1,
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as ChapterMeta,
    ]);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('Initial Load', () => {
    it('should load chapters on mount', async () => {
      render(<AnalyticsPanel />);

      await waitFor(() => {
        expect(mockChaptersList).toHaveBeenCalledWith('test-project');
      });
    });

    it('should dispatch LOAD_FOR_PROJECT with correct payload', async () => {
      render(<AnalyticsPanel />);

      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalledWith({
          type: 'LOAD_FOR_PROJECT',
          payload: {
            projectId: 'test-project',
            chapters: expect.arrayContaining([
              expect.objectContaining({ id: 'ch1', wordCount: 500 }),
              expect.objectContaining({ id: 'ch2', wordCount: 800 }),
            ]),
          },
        });
      });
    });

    it('should skip load without projectId', () => {
      // Mock no project
      vi.mocked(require('@/context/AppContext').useAppContext).mockReturnValue({
        state: { currentProjectId: '' },
        currentProject: null,
        dispatch: vi.fn(),
      });

      render(<AnalyticsPanel />);

      expect(mockChaptersList).not.toHaveBeenCalled();
    });
  });

  describe('Polling Interval', () => {
    it('should poll chapters every 3 seconds', async () => {
      render(<AnalyticsPanel />);

      // Initial load
      await waitFor(() => {
        expect(mockChaptersList).toHaveBeenCalledTimes(1);
      });

      // Advance 3 seconds
      await vi.advanceTimersByTimeAsync(3000);

      expect(mockChaptersList).toHaveBeenCalledTimes(2);

      // Advance another 3 seconds
      await vi.advanceTimersByTimeAsync(3000);

      expect(mockChaptersList).toHaveBeenCalledTimes(3);
    });

    it('should clear interval on unmount', async () => {
      const { unmount } = render(<AnalyticsPanel />);

      await waitFor(() => {
        expect(mockChaptersList).toHaveBeenCalledTimes(1);
      });

      unmount();

      // Advance time after unmount
      await vi.advanceTimersByTimeAsync(6000);

      // Should not call again after unmount
      expect(mockChaptersList).toHaveBeenCalledTimes(1);
    });

    it('should dispatch on each poll', async () => {
      render(<AnalyticsPanel />);

      // Initial load
      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalledTimes(1);
      });

      // Advance 6 seconds (2 polls)
      await vi.advanceTimersByTimeAsync(6000);

      expect(mockDispatch).toHaveBeenCalledTimes(3); // Initial + 2 polls
    });
  });

  describe('Error Handling', () => {
    it('should handle chapter list error gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockChaptersList.mockRejectedValue(new Error('IndexedDB error'));

      render(<AnalyticsPanel />);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          '[AnalyticsPanel] Failed to load chapters:',
          expect.any(Error),
        );
      });

      // Component should still render
      expect(screen.getByText(/Writing Analytics/i)).toBeInTheDocument();

      consoleErrorSpy.mockRestore();
    });

    it('should not crash on dispatch error', async () => {
      mockDispatch.mockImplementation(() => {
        throw new Error('Dispatch error');
      });

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<AnalyticsPanel />);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      // Component should still be mounted
      expect(screen.getByText(/Writing Analytics/i)).toBeInTheDocument();

      consoleErrorSpy.mockRestore();
    });

    it('should continue polling after error', async () => {
      mockChaptersList
        .mockRejectedValueOnce(new Error('First error'))
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<AnalyticsPanel />);

      // First call fails
      await waitFor(() => {
        expect(mockChaptersList).toHaveBeenCalledTimes(1);
      });

      // Should continue polling
      await vi.advanceTimersByTimeAsync(3000);

      expect(mockChaptersList).toHaveBeenCalledTimes(2);

      consoleErrorSpy.mockRestore();
    });
  });

  describe('UI Rendering', () => {
    it('should render total words correctly', () => {
      render(<AnalyticsPanel />);

      expect(screen.getByText('1,500')).toBeInTheDocument();
      expect(screen.getByText('Total Words')).toBeInTheDocument();
    });

    it('should render writing days', () => {
      render(<AnalyticsPanel />);

      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('Writing Days')).toBeInTheDocument();
    });

    it('should render daily average', () => {
      render(<AnalyticsPanel />);

      expect(screen.getByText('300')).toBeInTheDocument();
      expect(screen.getByText('Daily Average')).toBeInTheDocument();
    });

    it('should render streak with plural days', () => {
      render(<AnalyticsPanel />);

      expect(screen.getByText('3 days')).toBeInTheDocument();
      expect(screen.getByText('Streak')).toBeInTheDocument();
    });

    it('should render streak with singular day', () => {
      vi.mocked(require('@/hooks/useProjectAnalytics').useProjectAnalytics).mockReturnValue({
        totals: {
          totalWords: 100,
          daysWithWriting: 1,
          dailyAvg: 100,
          streak: 1,
        },
        chapters: {
          chapterCount: 1,
          chapterWords: 100,
          avgWordsPerChapter: 100,
        },
        sessions: [],
      });

      render(<AnalyticsPanel />);

      expect(screen.getByText('1 day')).toBeInTheDocument();
    });

    it('should render chapter statistics', () => {
      render(<AnalyticsPanel />);

      expect(screen.getByText('Chapter Statistics')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument(); // chapter count
      expect(screen.getByText('1,500')).toBeInTheDocument(); // manuscript words
      expect(screen.getByText('500')).toBeInTheDocument(); // avg words per chapter
    });

    it('should render longest chapter info', () => {
      render(<AnalyticsPanel />);

      expect(screen.getByText('Chapter 1')).toBeInTheDocument();
      expect(screen.getByText('800 words')).toBeInTheDocument();
    });

    it('should not show tour completion card', () => {
      render(<AnalyticsPanel />);

      expect(screen.queryByText(/Tour Engagement/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Completion rate/i)).not.toBeInTheDocument();
    });
  });

  describe('View Mode Toggle', () => {
    it('should show simple view by default when no enhanced analytics', () => {
      vi.mocked(require('@/context/AppContext').useAppContext).mockReturnValue({
        state: { currentProjectId: 'test-project' },
        currentProject: { id: 'test-project', name: 'Test Project' },
        dispatch: vi.fn(),
      });

      render(<AnalyticsPanel />);

      expect(screen.getByText(/Writing Analytics/i)).toBeInTheDocument();
      expect(screen.queryByText(/Advanced Analytics View/i)).not.toBeInTheDocument();
    });

    it('should show advanced view when project has sessions', () => {
      vi.mocked(require('@/context/AppContext').useAppContext).mockReturnValue({
        state: { currentProjectId: 'test-project' },
        currentProject: {
          id: 'test-project',
          name: 'Test Project',
          sessions: [],
        },
        dispatch: vi.fn(),
      });

      render(<AnalyticsPanel />);

      expect(screen.getByText(/Advanced Analytics View/i)).toBeInTheDocument();
    });
  });

  describe('Project Change', () => {
    it('should reload chapters when project changes', async () => {
      const { rerender } = render(<AnalyticsPanel />);

      await waitFor(() => {
        expect(mockChaptersList).toHaveBeenCalledWith('test-project');
      });

      // Change project
      vi.mocked(require('@/context/AppContext').useAppContext).mockReturnValue({
        state: { currentProjectId: 'new-project' },
        currentProject: { id: 'new-project', name: 'New Project' },
        dispatch: vi.fn(),
      });

      rerender(<AnalyticsPanel />);

      await waitFor(() => {
        expect(mockChaptersList).toHaveBeenCalledWith('new-project');
      });
    });
  });

  describe('Tour Triggers', () => {
    it('should trigger analytics visited on mount', () => {
      const mockTrigger = vi.mocked(require('@/utils/tourTriggers').triggerAnalyticsVisited);

      render(<AnalyticsPanel />);

      expect(mockTrigger).toHaveBeenCalled();
    });
  });
});
