/**
 * AI Service Tests
 *
 * Tests for the main AI service orchestration layer.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { aiService } from '../aiService';
import { aiSettingsService } from '../aiSettingsService';
import { AIKeyError } from '@/ai/types';

describe('AI Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();

    // Reset settings to defaults
    aiSettingsService.resetSettings();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generate', () => {
    it('uses default provider and model from settings', async () => {
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
      expect(result.provider).toBe('openrouter'); // Default free provider
    });

    it('allows provider override', async () => {
      // Disable auto-fallback for this test
      aiSettingsService.updatePreferences({ autoFallback: false });

      // Set API key for OpenAI before mocking fetch
      aiSettingsService.setApiKey('openai', 'sk-test123456789012345');

      const mockResponse = {
        choices: [{ message: { content: 'Generated text' }, finish_reason: 'stop' }],
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
      };

      // Mock fetch to succeed for OpenAI
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      // Use a paid model (gpt-4o) to test key retrieval
      const result = await aiService.generate('test prompt', {
        providerId: 'openai',
        modelId: 'gpt-4o',
      });

      // Verify OpenAI provider was used (not fallback)
      expect(result.provider).toBe('openai');
      expect(result.content).toBe('Generated text');

      // Re-enable auto-fallback for other tests
      aiSettingsService.updatePreferences({ autoFallback: true });
    });

    it('applies custom temperature and maxTokens', async () => {
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

    it('tracks usage when enabled', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Generated text' }, finish_reason: 'stop' }],
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      aiSettingsService.updatePreferences({ trackUsage: true });

      await aiService.generate('test prompt');

      const usage = aiSettingsService.getUsage('openrouter');
      expect(usage?.promptTokens).toBe(10);
      expect(usage?.completionTokens).toBe(20);
      expect(usage?.totalTokens).toBe(30);
      expect(usage?.requestCount).toBe(1);
    });

    it('throws error when API key is missing for paid model', async () => {
      await expect(
        aiService.generate('test prompt', {
          providerId: 'openai',
          modelId: 'gpt-4o',
        }),
      ).rejects.toThrow(AIKeyError);
    });

    it('supports abort signal', async () => {
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

  describe('auto-fallback', () => {
    it('falls back to free model on key error', async () => {
      aiSettingsService.updatePreferences({ autoFallback: true });

      // First call fails with key error
      // Second call succeeds with free model
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: async () => ({ error: { message: 'Invalid API key' } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            choices: [{ message: { content: 'Fallback response' }, finish_reason: 'stop' }],
            usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
          }),
        });

      aiSettingsService.setApiKey('openai', 'invalid-key');

      const result = await aiService.generate('test prompt', {
        providerId: 'openai',
        modelId: 'gpt-4o',
      });

      expect(result.content).toBe('Fallback response');
    });

    it('respects autoFallback preference', async () => {
      aiSettingsService.updatePreferences({ autoFallback: false });

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: { message: 'Invalid API key' } }),
      });

      aiSettingsService.setApiKey('openai', 'invalid-key');

      await expect(
        aiService.generate('test prompt', {
          providerId: 'openai',
          modelId: 'gpt-4o',
        }),
      ).rejects.toThrow(AIKeyError);
    });
  });

  describe('testProvider', () => {
    it('validates provider configuration', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'test successful' }, finish_reason: 'stop' }],
          usage: { prompt_tokens: 5, completion_tokens: 5, total_tokens: 10 },
        }),
      });

      const result = await aiService.testProvider('openrouter');

      expect(result.success).toBe(true);
    });

    it('detects invalid API keys', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: { message: 'Invalid API key' } }),
      });

      const result = await aiService.testProvider('openai', 'invalid-key');

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it('validates key format', async () => {
      const result = await aiService.testProvider('openai', 'clearly-invalid');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid API key format');
    });
  });

  describe('getProviderStatus', () => {
    it('returns current provider configuration', () => {
      const status = aiService.getProviderStatus();

      expect(status.current.providerId).toBe('openrouter');
      expect(status.current.modelId).toBeTruthy();
      expect(status.preferences).toBeDefined();
    });

    it('shows which providers have API keys', () => {
      aiSettingsService.setApiKey('openai', 'sk-test123456789012345');
      aiSettingsService.setApiKey('anthropic', 'sk-ant-test123456789012345');

      const status = aiService.getProviderStatus();

      expect(status.hasKeys).toContain('openai');
      expect(status.hasKeys).toContain('anthropic');
    });
  });
});
