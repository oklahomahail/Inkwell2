/**
 * EnhancedChapterEditor Tests
 *
 * Tests for TipTap-based chapter editor with autosave integration
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import EnhancedChapterEditor from '../EnhancedChapterEditor';

describe('EnhancedChapterEditor', () => {
  let mockSaveFn: ReturnType<typeof vi.fn>;
  let mockOnSaved: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockSaveFn = vi.fn().mockResolvedValue({ checksum: 'abc123' });
    mockOnSaved = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render editor with initial content', () => {
    render(
      <EnhancedChapterEditor
        chapterId="ch1"
        initialContent="Initial chapter content"
        saveFn={mockSaveFn}
      />,
    );

    const textarea = screen.getByTestId('editor-textarea');
    expect(textarea).toHaveValue('Initial chapter content');
  });

  it('should have correct data attributes', () => {
    const { container } = render(
      <EnhancedChapterEditor chapterId="ch1" initialContent="" saveFn={mockSaveFn} />,
    );

    const editor = container.querySelector('[data-editor="enhanced"]');
    expect(editor).toBeInTheDocument();
    expect(editor).toHaveAttribute('data-chapter-id', 'ch1');
  });

  it('should schedule autosave on content change', async () => {
    vi.useFakeTimers();
    render(<EnhancedChapterEditor chapterId="ch1" initialContent="" saveFn={mockSaveFn} />);

    const textarea = screen.getByTestId('editor-textarea');
    fireEvent.change(textarea, { target: { value: 'New content' } });

    // Advance timer to trigger debounce
    await vi.advanceTimersByTimeAsync(1000);

    expect(mockSaveFn).toHaveBeenCalledWith('ch1', 'New content');
    vi.useRealTimers();
  });

  it('should debounce rapid changes', async () => {
    vi.useFakeTimers();
    render(<EnhancedChapterEditor chapterId="ch1" initialContent="" saveFn={mockSaveFn} />);

    const textarea = screen.getByTestId('editor-textarea');

    // Fire multiple change events rapidly
    fireEvent.change(textarea, { target: { value: 'A' } });
    await vi.advanceTimersByTimeAsync(500);
    fireEvent.change(textarea, { target: { value: 'AB' } });
    await vi.advanceTimersByTimeAsync(500);
    fireEvent.change(textarea, { target: { value: 'ABC' } });

    // Advance to trigger debounce
    await vi.advanceTimersByTimeAsync(1000);

    // Should only save once with final content
    expect(mockSaveFn).toHaveBeenCalledTimes(1);
    expect(mockSaveFn).toHaveBeenCalledWith('ch1', 'ABC');
    vi.useRealTimers();
  });

  it('should flush on unmount', async () => {
    const { unmount } = render(
      <EnhancedChapterEditor chapterId="ch1" initialContent="" saveFn={mockSaveFn} />,
    );

    const textarea = screen.getByTestId('editor-textarea');
    fireEvent.change(textarea, { target: { value: 'Unsaved content' } });

    // Unmount before debounce triggers
    unmount();

    // Wait for flush promise
    await waitFor(() => {
      expect(mockSaveFn).toHaveBeenCalledWith('ch1', 'Unsaved content');
    });
  });

  it('should call onSaved callback after successful save', async () => {
    const { unmount } = render(
      <EnhancedChapterEditor
        chapterId="ch1"
        initialContent=""
        saveFn={mockSaveFn}
        onSaved={mockOnSaved}
      />,
    );

    const textarea = screen.getByTestId('editor-textarea');
    fireEvent.change(textarea, { target: { value: 'Content' } });

    unmount();

    await waitFor(() => {
      expect(mockOnSaved).toHaveBeenCalled();
    });
  });

  it('should handle save errors gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockSaveFn.mockRejectedValue(new Error('Save failed'));

    const { unmount } = render(
      <EnhancedChapterEditor chapterId="ch1" initialContent="" saveFn={mockSaveFn} />,
    );

    const textarea = screen.getByTestId('editor-textarea');
    fireEvent.change(textarea, { target: { value: 'Content' } });

    unmount();

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[EnhancedChapterEditor] Failed to flush on unmount:',
        expect.any(Error),
      );
    });

    consoleErrorSpy.mockRestore();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <EnhancedChapterEditor
        chapterId="ch1"
        initialContent=""
        saveFn={mockSaveFn}
        className="custom-editor-class"
      />,
    );

    const editor = container.querySelector('.enhanced-chapter-editor');
    expect(editor).toHaveClass('custom-editor-class');
  });

  it('should not save empty content on unmount without changes', async () => {
    const { unmount } = render(
      <EnhancedChapterEditor chapterId="ch1" initialContent="" saveFn={mockSaveFn} />,
    );

    unmount();

    // Wait a bit to ensure no save is triggered
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mockSaveFn).not.toHaveBeenCalled();
  });

  it('should handle chapter ID changes', async () => {
    const { rerender } = render(
      <EnhancedChapterEditor chapterId="ch1" initialContent="Chapter 1" saveFn={mockSaveFn} />,
    );

    const textarea = screen.getByTestId('editor-textarea');
    fireEvent.change(textarea, { target: { value: 'Updated Chapter 1' } });

    // Change chapter ID
    rerender(
      <EnhancedChapterEditor chapterId="ch2" initialContent="Chapter 2" saveFn={mockSaveFn} />,
    );

    // Should flush ch1 and show ch2
    await waitFor(() => {
      expect(mockSaveFn).toHaveBeenCalledWith('ch1', expect.stringContaining('Updated Chapter 1'));
    });

    expect(textarea).toHaveValue('Chapter 2');
  });

  it('should show placeholder when empty', () => {
    render(<EnhancedChapterEditor chapterId="ch1" initialContent="" saveFn={mockSaveFn} />);

    const textarea = screen.getByTestId('editor-textarea');
    expect(textarea).toHaveAttribute('placeholder', 'Start writing your chapter...');
  });
});
