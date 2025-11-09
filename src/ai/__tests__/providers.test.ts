/**
 * AI Provider Tests
 *
 * Tests for all AI provider adapters.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { openaiProvider } from '../providers/openaiProvider';
import { anthropicProvider } from '../providers/anthropicProvider';
import { openrouterProvider } from '../providers/openrouterProvider';
import { AIKeyError, AIProviderError } from '../types';

describe('OpenAI Provider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('has correct metadata', () => {
    expect(openaiProvider.id).toBe('openai');
    expect(openaiProvider.name).toBe('OpenAI');
    expect(openaiProvider.requiresKey).toBe(true);
    expect(openaiProvider.models.length).toBeGreaterThan(0);
  });

  it('validates API key format', () => {
    expect(openaiProvider.validateKey?.('sk-test123456789012345')).toBe(true);
    expect(openaiProvider.validateKey?.('invalid-key')).toBe(false);
    expect(openaiProvider.validateKey?.('')).toBe(false);
  });

  it('throws error when API key is missing', async () => {
    await expect(openaiProvider.generate('test prompt')).rejects.toThrow(AIKeyError);
  });

  it('generates text successfully', async () => {
    const mockResponse = {
      choices: [{ message: { content: 'Generated text' }, finish_reason: 'stop' }],
      usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await openaiProvider.generate('test prompt', {
      apiKey: 'sk-test123456789012345',
    });

    expect(result.content).toBe('Generated text');
    expect(result.provider).toBe('openai');
    expect(result.usage?.totalTokens).toBe(30);
  });

  it('handles API errors correctly', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: { message: 'Invalid API key' } }),
    });

    await expect(
      openaiProvider.generate('test prompt', { apiKey: 'sk-test123456789012345' }),
    ).rejects.toThrow(AIKeyError);
  });

  it('handles rate limit errors', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({ error: { message: 'Rate limit exceeded' } }),
    });

    await expect(
      openaiProvider.generate('test prompt', { apiKey: 'sk-test123456789012345' }),
    ).rejects.toThrow('Rate limit exceeded');
  });

  it('supports streaming', async () => {
    expect(openaiProvider.generateStream).toBeDefined();

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
    for await (const chunk of openaiProvider.generateStream!('test prompt', {
      apiKey: 'sk-test123456789012345',
    })) {
      if (chunk.content) {
        chunks.push(chunk.content);
      }
    }

    expect(chunks).toEqual(['Hello', ' world']);
  });
});

describe('Anthropic Provider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('has correct metadata', () => {
    expect(anthropicProvider.id).toBe('anthropic');
    expect(anthropicProvider.name).toBe('Anthropic');
    expect(anthropicProvider.requiresKey).toBe(true);
    expect(anthropicProvider.models.length).toBeGreaterThan(0);
  });

  it('validates API key format', () => {
    expect(anthropicProvider.validateKey?.('sk-ant-test123456789012345')).toBe(true);
    expect(anthropicProvider.validateKey?.('invalid-key')).toBe(false);
  });

  it('generates text successfully', async () => {
    const mockResponse = {
      content: [{ text: 'Generated text' }],
      stop_reason: 'end_turn',
      usage: { input_tokens: 10, output_tokens: 20 },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await anthropicProvider.generate('test prompt', {
      apiKey: 'sk-ant-test123456789012345',
    });

    expect(result.content).toBe('Generated text');
    expect(result.provider).toBe('anthropic');
    expect(result.usage?.totalTokens).toBe(30);
  });

  it('handles system messages correctly', async () => {
    const mockResponse = {
      content: [{ text: 'Generated text' }],
      stop_reason: 'end_turn',
      usage: { input_tokens: 10, output_tokens: 20 },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    await anthropicProvider.generate('test prompt', {
      apiKey: 'sk-ant-test123456789012345',
      systemMessage: 'You are a helpful assistant',
    });

    const callArgs = (global.fetch as any).mock.calls[0];
    const body = JSON.parse(callArgs[1].body);
    expect(body.system).toBe('You are a helpful assistant');
  });

  it('supports streaming', async () => {
    expect(anthropicProvider.generateStream).toBeDefined();

    const mockChunks = [
      'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"Hello"}}\n',
      'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":" world"}}\n',
      'data: {"type":"message_stop"}\n',
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
    for await (const chunk of anthropicProvider.generateStream!('test prompt', {
      apiKey: 'sk-ant-test123456789012345',
    })) {
      if (chunk.content) {
        chunks.push(chunk.content);
      }
    }

    expect(chunks).toEqual(['Hello', ' world']);
  });
});

describe('OpenRouter Provider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('has correct metadata', () => {
    expect(openrouterProvider.id).toBe('openrouter');
    expect(openrouterProvider.name).toBe('OpenRouter');
    expect(openrouterProvider.requiresKey).toBe(false); // Optional key
    expect(openrouterProvider.models.length).toBeGreaterThan(0);
  });

  it('includes free models', () => {
    const freeModels = openrouterProvider.models.filter((m) => m.isFree);
    expect(freeModels.length).toBeGreaterThan(0);
  });

  it('validates API key format', () => {
    expect(openrouterProvider.validateKey?.('sk-or-test123456789012345')).toBe(true);
    expect(openrouterProvider.validateKey?.('invalid-key')).toBe(false);
  });

  it('works without API key for free models', async () => {
    const mockResponse = {
      choices: [{ message: { content: 'Generated text' }, finish_reason: 'stop' }],
      usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await openrouterProvider.generate('test prompt');

    expect(result.content).toBe('Generated text');
    expect(result.provider).toBe('openrouter');

    // Verify headers don't include Authorization when no key provided
    const callArgs = (global.fetch as any).mock.calls[0];
    expect(callArgs[1].headers['Authorization']).toBeUndefined();
  });

  it('includes API key when provided', async () => {
    const mockResponse = {
      choices: [{ message: { content: 'Generated text' }, finish_reason: 'stop' }],
      usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    await openrouterProvider.generate('test prompt', {
      apiKey: 'sk-or-test123456789012345',
    });

    const callArgs = (global.fetch as any).mock.calls[0];
    expect(callArgs[1].headers['Authorization']).toBe('Bearer sk-or-test123456789012345');
  });

  it('includes required headers', async () => {
    const mockResponse = {
      choices: [{ message: { content: 'Generated text' }, finish_reason: 'stop' }],
      usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    await openrouterProvider.generate('test prompt');

    const callArgs = (global.fetch as any).mock.calls[0];
    expect(callArgs[1].headers['HTTP-Referer']).toBe('https://inkwell.app');
    expect(callArgs[1].headers['X-Title']).toBe('Inkwell');
  });

  it('handles abort signal', async () => {
    const controller = new AbortController();

    global.fetch = vi.fn().mockImplementation(() => {
      controller.abort();
      return Promise.reject(new Error('Aborted'));
    });

    await expect(
      openrouterProvider.generate('test prompt', { signal: controller.signal }),
    ).rejects.toThrow(AIProviderError);
  });
});

describe('Provider Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('handles network errors', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    await expect(
      openaiProvider.generate('test prompt', { apiKey: 'sk-test123456789012345' }),
    ).rejects.toThrow(AIProviderError);
  });

  it('handles malformed JSON responses', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => {
        throw new Error('Invalid JSON');
      },
    });

    await expect(
      openaiProvider.generate('test prompt', { apiKey: 'sk-test123456789012345' }),
    ).rejects.toThrow();
  });

  it('handles quota exceeded errors', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ error: { message: 'Quota exceeded' } }),
    });

    await expect(
      openaiProvider.generate('test prompt', { apiKey: 'sk-test123456789012345' }),
    ).rejects.toThrow('Quota exceeded');
  });
});
