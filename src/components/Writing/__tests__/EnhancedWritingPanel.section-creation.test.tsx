/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EnhancedWritingPanel from '../EnhancedWritingPanel';
import * as useSectionsModule from '@/hooks/useSections';

// Mock the hooks and context
vi.mock('@/context/AppContext', () => ({
  useAppContext: () => ({
    currentProject: { id: 'test-project-id', name: 'Test Project' },
    state: { projects: [] },
    dispatch: vi.fn(),
  }),
}));

vi.mock('@/context/EditorContext', () => ({
  useEditorContext: () => ({
    insertText: vi.fn(),
  }),
}));

vi.mock('@/context/toast', () => ({
  useToast: () => ({
    showToast: vi.fn(),
    removeToast: vi.fn(),
    clearToasts: vi.fn(),
    toasts: [],
  }),
}));

vi.mock('@/hooks/useSections');

vi.mock('@/hooks/useProjectAnalytics', () => ({
  useProjectAnalytics: () => ({
    totals: {
      totalWords: 1000,
      daysWithWriting: 5,
      dailyAvg: 200,
      streak: 3,
    },
    chapters: {
      chapterCount: 2,
      chapterWords: 1000,
      avgWordsPerChapter: 500,
    },
    sessions: [],
    notice: undefined,
  }),
}));

vi.mock('@/context/ChaptersContext', () => ({
  useChapterList: () => [],
  useChapterWordTotals: () => ({
    total: 0,
    avg: 0,
    longest: undefined,
    count: 0,
  }),
}));

describe('EnhancedWritingPanel - Section Creation', () => {
  const mockCreateSection = vi.fn();
  const mockSetActive = vi.fn();
  const mockGetActiveSection = vi.fn();
  const mockUpdateContent = vi.fn();
  const mockDeleteSection = vi.fn();
  const mockSyncNow = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock implementation
    vi.mocked(useSectionsModule.useSections).mockReturnValue({
      sections: [
        {
          id: 'section-1',
          title: 'Existing Section',
          type: 'chapter' as const,
          order: 0,
          content: 'Test content',
          createdAt: new Date().toISOString(),
        },
      ],
      activeId: 'section-1',
      getActiveSection: mockGetActiveSection.mockResolvedValue({
        id: 'section-1',
        title: 'Existing Section',
        type: 'chapter' as const,
        order: 0,
        content: 'Test content',
        createdAt: new Date().toISOString(),
      }),
      setActive: mockSetActive,
      createSection: mockCreateSection,
      deleteSection: mockDeleteSection,
      updateContent: mockUpdateContent,
      syncing: false,
      lastSynced: null,
      syncNow: mockSyncNow,
      realtimeConnected: false,
      liveUpdateReceived: false,
    });
  });

  it('should render "New Section" button', () => {
    render(<EnhancedWritingPanel />);
    // Use getAllByRole and find the header button (first one with btn-primary class)
    const buttons = screen.getAllByRole('button', { name: /new section/i });
    expect(buttons.length).toBeGreaterThan(0);
    expect(buttons[0]).toBeInTheDocument();
  });

  it('should call createSection when button is clicked', async () => {
    const user = userEvent.setup();
    mockCreateSection.mockResolvedValue({
      id: 'new-section',
      title: 'New Section',
      type: 'chapter',
      order: 1,
      content: '',
      createdAt: new Date().toISOString(),
    });

    render(<EnhancedWritingPanel />);
    // Get the header button (first one)
    const buttons = screen.getAllByRole('button', { name: /new section/i });
    const button = buttons[0];

    await user.click(button);

    await waitFor(() => {
      expect(mockCreateSection).toHaveBeenCalledWith('New Section', 'chapter');
    });
  });

  it('should show "Creating..." text while creating section', async () => {
    const user = userEvent.setup();
    let resolveCreate: any;
    const createPromise = new Promise((resolve) => {
      resolveCreate = resolve;
    });
    mockCreateSection.mockReturnValue(createPromise);

    render(<EnhancedWritingPanel />);
    // Get the header button (first one)
    const buttons = screen.getAllByRole('button', { name: /new section/i });
    const button = buttons[0];

    await user.click(button);

    // Button should show "Creating..." text (both buttons will show this)
    const creatingButtons = screen.getAllByText(/creating/i);
    expect(creatingButtons.length).toBeGreaterThan(0);

    // Resolve the promise
    resolveCreate({
      id: 'new-section',
      title: 'New Section',
      type: 'chapter',
      order: 1,
      content: '',
      createdAt: new Date().toISOString(),
    });

    // Wait for button to return to normal state
    await waitFor(() => {
      expect(screen.queryByText(/creating/i)).not.toBeInTheDocument();
    });
  });

  it('should disable button while creating section', async () => {
    const user = userEvent.setup();
    let resolveCreate: any;
    const createPromise = new Promise((resolve) => {
      resolveCreate = resolve;
    });
    mockCreateSection.mockReturnValue(createPromise);

    render(<EnhancedWritingPanel />);
    // Get the header button (first one)
    const buttons = screen.getAllByRole('button', { name: /new section/i });
    const button = buttons[0];

    await user.click(button);

    // Button should be disabled
    expect(button).toBeDisabled();

    // Resolve the promise
    resolveCreate({
      id: 'new-section',
      title: 'New Section',
      type: 'chapter',
      order: 1,
      content: '',
      createdAt: new Date().toISOString(),
    });

    // Wait for button to be enabled again
    await waitFor(() => {
      expect(button).not.toBeDisabled();
    });
  });

  it('should prevent double-clicks during creation', async () => {
    const user = userEvent.setup();
    let resolveCreate: any;
    const createPromise = new Promise((resolve) => {
      resolveCreate = resolve;
    });
    mockCreateSection.mockReturnValue(createPromise);

    render(<EnhancedWritingPanel />);
    // Get the header button (first one)
    const buttons = screen.getAllByRole('button', { name: /new section/i });
    const button = buttons[0];

    // Click multiple times rapidly
    await user.click(button);
    await user.click(button);
    await user.click(button);

    // Wait for the 700ms delay before createSection is called
    await waitFor(
      () => {
        expect(mockCreateSection).toHaveBeenCalled();
      },
      { timeout: 1000 },
    );

    // createSection should only be called once despite multiple clicks
    expect(mockCreateSection).toHaveBeenCalledTimes(1);

    // Resolve the promise
    resolveCreate({
      id: 'new-section',
      title: 'New Section',
      type: 'chapter',
      order: 1,
      content: '',
      createdAt: new Date().toISOString(),
    });

    await waitFor(() => {
      expect(button).not.toBeDisabled();
    });
  });

  it('should handle errors gracefully', async () => {
    const user = userEvent.setup();
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockCreateSection.mockRejectedValue(new Error('Failed to create section'));

    render(<EnhancedWritingPanel />);
    // Get the header button (first one)
    const buttons = screen.getAllByRole('button', { name: /new section/i });
    const button = buttons[0];

    await user.click(button);

    // Wait for error to be logged (after 700ms delay + promise rejection)
    await waitFor(
      () => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          '[EnhancedWritingPanel] Failed to create section:',
          expect.any(Error),
        );
      },
      { timeout: 1500 },
    );

    // Button should be enabled again after error
    await waitFor(
      () => {
        expect(button).not.toBeDisabled();
      },
      { timeout: 500 },
    );

    consoleErrorSpy.mockRestore();
  });

  it('should not break UI if createSection throws', async () => {
    const user = userEvent.setup();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mockCreateSection.mockRejectedValue(new Error('Network error'));

    render(<EnhancedWritingPanel />);
    // Get the header button (first one)
    const buttons = screen.getAllByRole('button', { name: /new section/i });
    const button = buttons[0];

    await user.click(button);

    // Wait for error to be handled (700ms delay + promise rejection + finally block)
    await waitFor(
      () => {
        expect(button).not.toBeDisabled();
      },
      { timeout: 1500 },
    );

    // Ensure the first call completed
    expect(mockCreateSection).toHaveBeenCalledTimes(1);

    // UI should still be functional - button can be clicked again
    await user.click(button);

    // Wait for the second call to happen (after the 700ms delay)
    await waitFor(
      () => {
        expect(mockCreateSection).toHaveBeenCalledTimes(2);
      },
      { timeout: 1000 },
    );
  });
});
