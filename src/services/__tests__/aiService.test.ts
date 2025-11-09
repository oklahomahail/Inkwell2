/**
 * AI Service Tests - Simplified Version
 *
 * Tests for the main AI service orchestration layer.
 * Uses environment-based configuration.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { aiService } from '../aiService';
import { AIKeyError } from '@/ai/types';
import * as aiConfig from '@/ai/config';

describe('AI Service - Simplified', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generate', () => {
    it('uses default provider and model', async () => {
      // Mock environment API key
      vi.spyOn(aiConfig, 'getApiKey').mockReturnValue('sk-test123456789012345');

      const mockResponse = {
        choices: [{ message: { content: 'Generated text' }, finish_reason: 'stop' }],
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await aiService.generate('test prompt');

      expect(result.content).toBe('Generated text');
      expect(result.provider).toBe('openai'); // Default provider
    });

    it('allows provider override', async () => {
      // Mock environment API key for Anthropic
      vi.spyOn(aiConfig, 'getApiKey').mockImplementation((provider) => {
        if (provider === 'anthropic') return 'sk-ant-test123456789012345';
        return undefined;
      });

      const mockResponse = {
        id: 'msg_123',
        type: 'message',
        role: 'assistant',
        content: [{ type: 'text', text: 'Generated text' }],
        model: 'claude-3-haiku-20240307',
        stop_reason: 'end_turn',
        usage: { input_tokens: 10, output_tokens: 20 },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await aiService.generate('test prompt', {
        providerId: 'anthropic',
        modelId: 'claude-3-haiku-20240307',
      });

      expect(result.provider).toBe('anthropic');
      expect(result.content).toBe('Generated text');
    });

    it('applies custom temperature and maxTokens', async () => {
      vi.spyOn(aiConfig, 'getApiKey').mockReturnValue('sk-test123456789012345');

      const mockResponse = {
        choices: [{ message: { content: 'Generated text' }, finish_reason: 'stop' }],
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      await aiService.generate('test prompt', {
        temperature: 0.9,
        maxTokens: 1000,
      });

      const callArgs = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body.temperature).toBe(0.9);
      expect(body.max_tokens).toBe(1000);
    });

    it('includes system message when provided', async () => {
      vi.spyOn(aiConfig, 'getApiKey').mockReturnValue('sk-test123456789012345');

      const mockResponse = {
        choices: [{ message: { content: 'Generated text' }, finish_reason: 'stop' }],
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      await aiService.generate('test prompt', {
        systemMessage: 'You are a helpful assistant',
      });

      const callArgs = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body.messages[0].role).toBe('system');
      expect(body.messages[0].content).toBe('You are a helpful assistant');
    });

    it('throws error when API key is missing', async () => {
      // Mock no API key
      vi.spyOn(aiConfig, 'getApiKey').mockReturnValue(undefined);

      await expect(aiService.generate('test prompt')).rejects.toThrow(AIKeyError);
    });

    it('supports abort signal', async () => {
      vi.spyOn(aiConfig, 'getApiKey').mockReturnValue('sk-test123456789012345');

      const controller = new AbortController();

      global.fetch = vi.fn().mockImplementation(
        () =>
          new Promise((_, reject) => {
            controller.signal.addEventListener('abort', () => {
              reject(new Error('Aborted'));
            });
          }),
      );

      setTimeout(() => controller.abort(), 10);

      await expect(
        aiService.generate('test prompt', { signal: controller.signal }),
      ).rejects.toThrow();
    });
  });

  describe('generateStream', () => {
    it('streams text chunks', async () => {
      vi.spyOn(aiConfig, 'getApiKey').mockReturnValue('sk-test123456789012345');

      const mockChunks = [
        'data: {"choices":[{"delta":{"content":"Hello"}}]}\n',
        'data: {"choices":[{"delta":{"content":" world"}}]}\n',
        'data: [DONE]\n',
      ];

      const mockReader = {
        read: vi
          .fn()
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode(mockChunks[0]),
          })
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode(mockChunks[1]),
          })
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode(mockChunks[2]),
          })
          .mockResolvedValueOnce({ done: true, value: undefined }),
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: { getReader: () => mockReader },
      });

      const chunks: string[] = [];
      for await (const chunk of aiService.generateStream('test prompt')) {
        if (chunk.content) {
          chunks.push(chunk.content);
        }
      }

      expect(chunks).toEqual(['Hello', ' world']);
    });

    it('calls onStream callback', async () => {
      vi.spyOn(aiConfig, 'getApiKey').mockReturnValue('sk-test123456789012345');

      const mockChunks = ['data: {"choices":[{"delta":{"content":"Hello"}}]}\n', 'data: [DONE]\n'];

      const mockReader = {
        read: vi
          .fn()
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode(mockChunks[0]),
          })
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode(mockChunks[1]),
          })
          .mockResolvedValueOnce({ done: true, value: undefined }),
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: { getReader: () => mockReader },
      });

      const onStream = vi.fn();

      for await (const chunk of aiService.generateStream('test prompt', { onStream })) {
        // Process chunks
      }

      expect(onStream).toHaveBeenCalledWith(
        expect.objectContaining({
          content: 'Hello',
          isComplete: false,
        }),
      );
    });
  });

  describe('testProvider', () => {
    it('validates provider configuration', async () => {
      vi.spyOn(aiConfig, 'getApiKey').mockReturnValue('sk-test123456789012345');

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'test successful' }, finish_reason: 'stop' }],
          usage: { prompt_tokens: 5, completion_tokens: 5, total_tokens: 10 },
        }),
      });

      const result = await aiService.testProvider('openai');

      expect(result.success).toBe(true);
    });

    it('detects missing API keys', async () => {
      vi.spyOn(aiConfig, 'getApiKey').mockReturnValue(undefined);

      const result = await aiService.testProvider('openai');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not configured');
    });

    it('validates key format', async () => {
      vi.spyOn(aiConfig, 'getApiKey').mockReturnValue('clearly-invalid');

      const result = await aiService.testProvider('openai');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid API key format');
    });
  });
});
