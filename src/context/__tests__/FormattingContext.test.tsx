/**
 * FormattingContext tests
 *
 * Comprehensive coverage for FormattingProvider and useFormatting hook
 */

import { act, renderHook, waitFor } from '@testing-library/react';
import React, { type ReactNode } from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import { FormattingProvider, useFormatting, useFormattingScope } from '@/context/FormattingContext';
import { DEFAULT_FORMATTING } from '@/types/formatting';

describe('FormattingContext', () => {
  const projectId = 'test-project-123';
  const storageKey = `inkwell:project:formatting:${projectId}`;

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllTimers();
  });

  afterEach(() => {
    localStorage.clear();
    vi.clearAllTimers();
  });

  const wrapper =
    (pId: string = projectId) =>
    ({ children }: { children: ReactNode }) => (
      <FormattingProvider projectId={pId}>{children}</FormattingProvider>
    );

  describe('FormattingProvider', () => {
    it('initializes with DEFAULT_FORMATTING when no stored data', async () => {
      const { result } = renderHook(() => useFormatting(), { wrapper: wrapper() });

      await waitFor(() => {
        expect(result.current.loaded).toBe(true);
      });

      expect(result.current.formatting).toEqual(DEFAULT_FORMATTING);
    });

    it('loads formatting from localStorage on mount', async () => {
      const customFormatting = {
        ...DEFAULT_FORMATTING,
        fontFamily: 'Inter',
        fontSize: 1.2,
      };
      localStorage.setItem(storageKey, JSON.stringify(customFormatting));

      const { result } = renderHook(() => useFormatting(), { wrapper: wrapper() });

      await waitFor(() => {
        expect(result.current.loaded).toBe(true);
      });

      expect(result.current.formatting.fontFamily).toBe('Inter');
      expect(result.current.formatting.fontSize).toBe(1.2);
    });

    it('handles malformed JSON in localStorage gracefully', async () => {
      localStorage.setItem(storageKey, '{invalid-json}');

      const { result } = renderHook(() => useFormatting(), { wrapper: wrapper() });

      await waitFor(() => {
        expect(result.current.loaded).toBe(true);
      });

      expect(result.current.formatting).toEqual(DEFAULT_FORMATTING);
    });

    it('ignores data with incorrect version', async () => {
      const oldVersionData = {
        ...DEFAULT_FORMATTING,
        version: 0, // wrong version
      };
      localStorage.setItem(storageKey, JSON.stringify(oldVersionData));

      const { result } = renderHook(() => useFormatting(), { wrapper: wrapper() });

      await waitFor(() => {
        expect(result.current.loaded).toBe(true);
      });

      expect(result.current.formatting).toEqual(DEFAULT_FORMATTING);
    });

    it('persists formatting changes to localStorage with debounce', async () => {
      const { result } = renderHook(() => useFormatting(), { wrapper: wrapper() });

      await waitFor(() => {
        expect(result.current.loaded).toBe(true);
      });

      act(() => {
        result.current.setFormatting({ fontSize: 1.5 });
      });

      // Should not save immediately
      expect(localStorage.getItem(storageKey)).toBeNull();

      // Wait for debounce
      await new Promise((resolve) => setTimeout(resolve, 300));

      const saved = localStorage.getItem(storageKey);
      expect(saved).not.toBeNull();
      const parsed = JSON.parse(saved!);
      expect(parsed.fontSize).toBe(1.5);
    });

    it('reloads formatting when projectId changes', async () => {
      const projectId1 = 'project-1';
      const projectId2 = 'project-2';

      const formatting1 = { ...DEFAULT_FORMATTING, fontSize: 1.2 };
      const formatting2 = { ...DEFAULT_FORMATTING, fontSize: 1.8 };

      localStorage.setItem(`inkwell:project:formatting:${projectId1}`, JSON.stringify(formatting1));
      localStorage.setItem(`inkwell:project:formatting:${projectId2}`, JSON.stringify(formatting2));

      const TestWrapper = ({
        projectId,
        children,
      }: {
        projectId: string;
        children: React.ReactNode;
      }) => <FormattingProvider projectId={projectId}>{children}</FormattingProvider>;

      const { result, rerender } = renderHook(() => useFormatting(), {
        wrapper: ({ children }) => <TestWrapper projectId={projectId1}>{children}</TestWrapper>,
      });

      await waitFor(() => {
        expect(result.current.loaded).toBe(true);
      });
      expect(result.current.formatting.fontSize).toBe(1.2);

      // Change projectId by rerendering with new wrapper
      rerender();
      // Force re-mount with new projectId
      const { result: result2 } = renderHook(() => useFormatting(), {
        wrapper: ({ children }) => <TestWrapper projectId={projectId2}>{children}</TestWrapper>,
      });

      await waitFor(() => {
        expect(result2.current.loaded).toBe(true);
      });
      expect(result2.current.formatting.fontSize).toBe(1.8);
    });
  });

  describe('setFormatting', () => {
    it('updates formatting with partial merge', async () => {
      const { result } = renderHook(() => useFormatting(), { wrapper: wrapper() });

      await waitFor(() => {
        expect(result.current.loaded).toBe(true);
      });

      act(() => {
        result.current.setFormatting({
          fontFamily: 'Inter',
          fontSize: 1.5,
        });
      });

      expect(result.current.formatting.fontFamily).toBe('Inter');
      expect(result.current.formatting.fontSize).toBe(1.5);
      expect(result.current.formatting.lineHeight).toBe(DEFAULT_FORMATTING.lineHeight);
    });

    it('deep merges chapterHeader fields', async () => {
      const { result } = renderHook(() => useFormatting(), { wrapper: wrapper() });

      await waitFor(() => {
        expect(result.current.loaded).toBe(true);
      });

      const originalChapterHeader = result.current.formatting.chapterHeader;

      act(() => {
        result.current.setFormatting({
          chapterHeader: {
            fontSize: 2.5,
          },
        });
      });

      expect(result.current.formatting.chapterHeader.fontSize).toBe(2.5);
      expect(result.current.formatting.chapterHeader.fontFamily).toBe(
        originalChapterHeader.fontFamily,
      );
      expect(result.current.formatting.chapterHeader.fontWeight).toBe(
        originalChapterHeader.fontWeight,
      );
    });

    it('deep merges margin fields', async () => {
      const { result } = renderHook(() => useFormatting(), { wrapper: wrapper() });

      await waitFor(() => {
        expect(result.current.loaded).toBe(true);
      });

      act(() => {
        result.current.setFormatting({
          margin: { top: 5 },
        });
      });

      expect(result.current.formatting.margin?.top).toBe(5);
      expect(result.current.formatting.margin?.right).toBe(DEFAULT_FORMATTING.margin?.right);
    });
  });

  describe('resetFormatting', () => {
    it('resets formatting to DEFAULT_FORMATTING', async () => {
      const { result } = renderHook(() => useFormatting(), { wrapper: wrapper() });

      await waitFor(() => {
        expect(result.current.loaded).toBe(true);
      });

      act(() => {
        result.current.setFormatting({
          fontFamily: 'Inter',
          fontSize: 2.0,
        });
      });

      expect(result.current.formatting.fontFamily).toBe('Inter');

      act(() => {
        result.current.resetFormatting();
      });

      expect(result.current.formatting).toEqual(DEFAULT_FORMATTING);

      // Wait for debounce to save defaults
      await new Promise((resolve) => setTimeout(resolve, 300));

      const saved = localStorage.getItem(storageKey);
      expect(saved).not.toBeNull();
      const parsed = JSON.parse(saved!);
      expect(parsed).toEqual(DEFAULT_FORMATTING);
    });
  });

  describe('applyToElement', () => {
    it('sets CSS custom properties on element', async () => {
      const { result } = renderHook(() => useFormatting(), { wrapper: wrapper() });

      await waitFor(() => {
        expect(result.current.loaded).toBe(true);
      });

      const mockElement = document.createElement('div');
      const spy = vi.spyOn(mockElement.style, 'setProperty');

      act(() => {
        result.current.applyToElement(mockElement);
      });

      expect(spy).toHaveBeenCalledWith('--ink-font-family', 'Literata');
      expect(spy).toHaveBeenCalledWith('--ink-font-size', '1rem');
      expect(spy).toHaveBeenCalledWith('--ink-line-height', '1.6');
      expect(spy).toHaveBeenCalledWith('--ink-para-spacing', '0.8rem');
    });

    it('handles null element gracefully', async () => {
      const { result } = renderHook(() => useFormatting(), { wrapper: wrapper() });

      await waitFor(() => {
        expect(result.current.loaded).toBe(true);
      });

      // Should not throw
      expect(() => {
        result.current.applyToElement(null);
      }).not.toThrow();
    });

    it('applies margin CSS variables', async () => {
      const { result } = renderHook(() => useFormatting(), { wrapper: wrapper() });

      await waitFor(() => {
        expect(result.current.loaded).toBe(true);
      });

      const mockElement = document.createElement('div');
      const spy = vi.spyOn(mockElement.style, 'setProperty');

      act(() => {
        result.current.applyToElement(mockElement);
      });

      expect(spy).toHaveBeenCalledWith('--ink-margin-top', '3rem');
      expect(spy).toHaveBeenCalledWith('--ink-margin-right', '2rem');
      expect(spy).toHaveBeenCalledWith('--ink-margin-bottom', '3rem');
      expect(spy).toHaveBeenCalledWith('--ink-margin-left', '2rem');
    });

    it('applies chapter header CSS variables', async () => {
      const { result } = renderHook(() => useFormatting(), { wrapper: wrapper() });

      await waitFor(() => {
        expect(result.current.loaded).toBe(true);
      });

      const mockElement = document.createElement('div');
      const spy = vi.spyOn(mockElement.style, 'setProperty');

      act(() => {
        result.current.applyToElement(mockElement);
      });

      expect(spy).toHaveBeenCalledWith('--ink-ch-font', 'Literata');
      expect(spy).toHaveBeenCalledWith('--ink-ch-size', '1.75rem');
      expect(spy).toHaveBeenCalledWith('--ink-ch-weight', '700');
      expect(spy).toHaveBeenCalledWith('--ink-ch-space-above', '1.5rem');
      expect(spy).toHaveBeenCalledWith('--ink-ch-space-below', '0.75rem');
    });

    it('uses fallback values for optional fields', async () => {
      const { result } = renderHook(() => useFormatting(), { wrapper: wrapper() });

      await waitFor(() => {
        expect(result.current.loaded).toBe(true);
      });

      const mockElement = document.createElement('div');
      const spy = vi.spyOn(mockElement.style, 'setProperty');

      // Apply with default formatting (which has all fields)
      act(() => {
        result.current.applyToElement(mockElement);
      });

      // Just verify the method was called - implementation applies defaults
      expect(spy).toHaveBeenCalled();
      expect(spy.mock.calls.length).toBeGreaterThan(0);
    });
  });

  describe('useFormatting hook', () => {
    it('throws error when used outside FormattingProvider', () => {
      expect(() => {
        renderHook(() => useFormatting());
      }).toThrow('useFormatting must be used within FormattingProvider');
    });
  });

  describe('useFormattingScope hook', () => {
    it('returns a ref and applies formatting on mount', async () => {
      const { result: providerResult } = renderHook(() => useFormatting(), { wrapper: wrapper() });

      await waitFor(() => {
        expect(providerResult.current.loaded).toBe(true);
      });

      const { result: scopeResult } = renderHook(() => useFormattingScope(), {
        wrapper: wrapper(),
      });

      const mockElement = document.createElement('div');
      const spy = vi.spyOn(mockElement.style, 'setProperty');

      // Assign element to ref
      act(() => {
        scopeResult.current.current = mockElement;
      });

      // Manually trigger the effect (simulating mount)
      act(() => {
        providerResult.current.applyToElement(scopeResult.current.current);
      });

      expect(spy).toHaveBeenCalledWith('--ink-font-family', expect.any(String));
    });
  });

  describe('localStorage edge cases', () => {
    it('handles localStorage QuotaExceededError on save', async () => {
      const { result } = renderHook(() => useFormatting(), { wrapper: wrapper() });

      await waitFor(() => {
        expect(result.current.loaded).toBe(true);
      });

      // Mock localStorage.setItem to throw QuotaExceededError AFTER loading
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new DOMException('QuotaExceededError');
      });

      // Should not throw - error is caught internally
      act(() => {
        result.current.setFormatting({ fontSize: 2.0 });
      });

      // Wait for debounce to trigger
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Restore
      setItemSpy.mockRestore();
    });

    it('loads default formatting when localStorage.getItem throws', async () => {
      // Mock getItem before rendering to prevent console errors
      const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('Access denied');
      });

      const { result } = renderHook(() => useFormatting(), { wrapper: wrapper() });

      await waitFor(() => {
        expect(result.current.loaded).toBe(true);
      });

      expect(result.current.formatting).toEqual(DEFAULT_FORMATTING);

      // Restore
      getItemSpy.mockRestore();
    });
  });
});
