/**
 * ClaudeProvider tests
 *
 * Coverage tests for ClaudeProvider and useClaude hook
 */

import { act, renderHook, waitFor } from '@testing-library/react';
import React, { type ReactNode } from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { ClaudeProvider, useClaude } from '@/context/ClaudeProvider';
import claudeService from '@/services/claudeService';

// Mock the claudeService
vi.mock('@/services/claudeService');

describe('ClaudeProvider', () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <ClaudeProvider>{children}</ClaudeProvider>
  );

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(claudeService.getMessages).mockReturnValue([]);
    vi.mocked(claudeService.isConfigured).mockReturnValue(true);
    vi.mocked(claudeService.generateMessageId).mockReturnValue('test-msg-id');
  });

  describe('initialization', () => {
    it('initializes with empty messages and configured state', () => {
      const { result } = renderHook(() => useClaude(), { wrapper });

      expect(result.current.claude.messages).toEqual([]);
      expect(result.current.claude.isConfigured).toBe(true);
      expect(result.current.claude.isLoading).toBe(false);
      expect(result.current.claude.error).toBeNull();
      expect(result.current.claude.isVisible).toBe(false);
    });

    it('loads existing messages from claudeService', () => {
      const existingMessages = [
        { id: '1', role: 'user' as const, content: 'Hello', timestamp: new Date() },
        { id: '2', role: 'assistant' as const, content: 'Hi there!', timestamp: new Date() },
      ];
      vi.mocked(claudeService.getMessages).mockReturnValue(existingMessages);

      const { result } = renderHook(() => useClaude(), { wrapper });

      expect(result.current.claude.messages).toEqual(existingMessages);
    });

    it('sets up status change listener if available', () => {
      renderHook(() => useClaude(), { wrapper });

      if (claudeService.addStatusChangeListener) {
        expect(claudeService.addStatusChangeListener).toHaveBeenCalled();
      }
    });
  });

  describe('sendMessage', () => {
    it('sends a message successfully', async () => {
      const mockResponse = { content: 'Response from Claude' };
      vi.mocked(claudeService.sendMessage).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useClaude(), { wrapper });

      let responseContent: string = '';

      await act(async () => {
        responseContent = await result.current.sendMessage('Hello Claude');
      });

      expect(claudeService.sendMessage).toHaveBeenCalledWith(
        'Hello Claude',
        expect.objectContaining({
          useFallback: true,
        }),
      );
      expect(responseContent).toBe('Response from Claude');
      expect(result.current.claude.messages.length).toBeGreaterThan(0);
    });

    it('includes selectedText in sendMessage options', async () => {
      const mockResponse = { content: 'Improved text' };
      vi.mocked(claudeService.sendMessage).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useClaude(), { wrapper });

      await act(async () => {
        await result.current.sendMessage('Improve this', 'Selected text here');
      });

      expect(claudeService.sendMessage).toHaveBeenCalledWith(
        'Improve this',
        expect.objectContaining({
          selectedText: 'Selected text here',
          useFallback: true,
        }),
      );
    });

    it('handles API errors gracefully', async () => {
      const error = new Error('API error occurred');
      vi.mocked(claudeService.sendMessage).mockRejectedValue(error);

      const { result } = renderHook(() => useClaude(), { wrapper });

      let responseContent: string = '';

      await act(async () => {
        responseContent = await result.current.sendMessage('Hello');
      });

      expect(responseContent).toBe('');
      expect(result.current.claude.error).toBe('API error occurred');
      expect(result.current.claude.isLoading).toBe(false);
    });

    it('handles non-Error exceptions', async () => {
      vi.mocked(claudeService.sendMessage).mockRejectedValue('String error');

      const { result } = renderHook(() => useClaude(), { wrapper });

      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      expect(result.current.claude.error).toBe('Failed to send message to Claude');
    });

    it('shows error when API key not configured', async () => {
      vi.mocked(claudeService.isConfigured).mockReturnValue(false);

      const { result } = renderHook(() => useClaude(), { wrapper });

      let responseContent: string = '';

      await act(async () => {
        responseContent = await result.current.sendMessage('Hello');
      });

      expect(responseContent).toBe('');
      expect(result.current.claude.error).toContain('Claude API key not configured');
      expect(claudeService.sendMessage).not.toHaveBeenCalled();
    });
  });

  describe('clearMessages', () => {
    it('clears all messages', () => {
      const { result } = renderHook(() => useClaude(), { wrapper });

      act(() => {
        result.current.clearMessages();
      });

      expect(claudeService.clearMessages).toHaveBeenCalled();
      expect(result.current.claude.messages).toEqual([]);
    });

    it('handles clearMessages errors gracefully', () => {
      vi.mocked(claudeService.clearMessages).mockImplementation(() => {
        throw new Error('Clear failed');
      });

      const { result } = renderHook(() => useClaude(), { wrapper });

      act(() => {
        result.current.clearMessages();
      });

      // Should still clear local state
      expect(result.current.claude.messages).toEqual([]);
    });
  });

  describe('toggleVisibility', () => {
    it('toggles isVisible state', () => {
      const { result } = renderHook(() => useClaude(), { wrapper });

      expect(result.current.claude.isVisible).toBe(false);

      act(() => {
        result.current.toggleVisibility();
      });

      expect(result.current.claude.isVisible).toBe(true);

      act(() => {
        result.current.toggleVisibility();
      });

      expect(result.current.claude.isVisible).toBe(false);
    });
  });

  describe('configureApiKey', () => {
    it('initializes claudeService with API key', () => {
      const { result } = renderHook(() => useClaude(), { wrapper });

      act(() => {
        result.current.configureApiKey('test-api-key');
      });

      expect(claudeService.initialize).toHaveBeenCalledWith('test-api-key');
    });

    it('handles initialization errors', () => {
      vi.mocked(claudeService.initialize).mockImplementation(() => {
        throw new Error('Init failed');
      });

      const { result } = renderHook(() => useClaude(), { wrapper });

      act(() => {
        result.current.configureApiKey('bad-key');
      });

      expect(result.current.claude.error).toBe('Failed to configure API key');
    });
  });

  describe('AI helper methods', () => {
    beforeEach(() => {
      vi.mocked(claudeService.sendMessage).mockResolvedValue({ content: 'AI response' });
    });

    it('suggestContinuation sends correct prompt', async () => {
      const { result } = renderHook(() => useClaude(), { wrapper });

      await act(async () => {
        await result.current.suggestContinuation('Once upon a time');
      });

      expect(claudeService.sendMessage).toHaveBeenCalledWith(
        expect.stringContaining('continue this text'),
      );
    });

    it('improveText sends correct prompt', async () => {
      const { result } = renderHook(() => useClaude(), { wrapper });

      await act(async () => {
        await result.current.improveText('Some text to improve');
      });

      expect(claudeService.sendMessage).toHaveBeenCalledWith(expect.stringContaining('improve'));
    });

    it('analyzeWritingStyle sends correct prompt', async () => {
      const { result } = renderHook(() => useClaude(), { wrapper });

      await act(async () => {
        await result.current.analyzeWritingStyle('Text to analyze');
      });

      expect(claudeService.sendMessage).toHaveBeenCalledWith(
        expect.stringContaining('analyze the writing style'),
      );
    });

    it('generatePlotIdeas sends prompt with context', async () => {
      const { result } = renderHook(() => useClaude(), { wrapper });

      await act(async () => {
        await result.current.generatePlotIdeas('A story about space');
      });

      expect(claudeService.sendMessage).toHaveBeenCalledWith(
        expect.stringContaining('A story about space'),
      );
    });

    it('generatePlotIdeas sends generic prompt without context', async () => {
      const { result } = renderHook(() => useClaude(), { wrapper });

      await act(async () => {
        await result.current.generatePlotIdeas();
      });

      expect(claudeService.sendMessage).toHaveBeenCalledWith(expect.stringContaining('5 creative'));
    });

    it('analyzeCharacter sends correct prompt', async () => {
      const { result } = renderHook(() => useClaude(), { wrapper });

      await act(async () => {
        await result.current.analyzeCharacter('John Doe');
      });

      expect(claudeService.sendMessage).toHaveBeenCalledWith(expect.stringContaining('John Doe'));
    });

    it('brainstormIdeas sends correct prompt', async () => {
      const { result } = renderHook(() => useClaude(), { wrapper });

      await act(async () => {
        await result.current.brainstormIdeas('Science fiction');
      });

      expect(claudeService.sendMessage).toHaveBeenCalledWith(
        expect.stringContaining('Science fiction'),
      );
    });

    it('handles errors in AI helper methods', async () => {
      vi.mocked(claudeService.sendMessage).mockRejectedValue(new Error('API Error'));

      const { result } = renderHook(() => useClaude(), { wrapper });

      await expect(result.current.suggestContinuation('text')).rejects.toThrow();
      await expect(result.current.improveText('text')).rejects.toThrow();
      await expect(result.current.analyzeWritingStyle('text')).rejects.toThrow();
      await expect(result.current.generatePlotIdeas('context')).rejects.toThrow();
      await expect(result.current.analyzeCharacter('name')).rejects.toThrow();
      await expect(result.current.brainstormIdeas('topic')).rejects.toThrow();
    });
  });

  describe('useClaude hook', () => {
    it('throws error when used outside ClaudeProvider', () => {
      expect(() => {
        renderHook(() => useClaude());
      }).toThrow('useClaude must be used within ClaudeProvider');
    });
  });
});
