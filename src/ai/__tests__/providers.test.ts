/**
 * AI Provider Tests - Simplified Version
 *
 * Tests for all AI provider adapters (OpenAI, Anthropic, Google).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { openaiProvider } from '../providers/openaiProvider';
import { anthropicProvider } from '../providers/anthropicProvider';
import { googleProvider } from '../providers/googleProvider';
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

describe('Google Provider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('has correct metadata', () => {
    expect(googleProvider.id).toBe('google');
    expect(googleProvider.name).toBe('Google AI');
    expect(googleProvider.requiresKey).toBe(true);
    expect(googleProvider.models.length).toBeGreaterThan(0);
  });

  it('validates API key format', () => {
    expect(googleProvider.validateKey?.('AIzatest123456789012345')).toBe(true);
    expect(googleProvider.validateKey?.('invalid-key')).toBe(false);
    expect(googleProvider.validateKey?.('')).toBe(false);
  });

  it('throws error when API key is missing', async () => {
    await expect(googleProvider.generate('test prompt')).rejects.toThrow(AIKeyError);
  });

  it('generates text successfully', async () => {
    const mockResponse = {
      candidates: [
        {
          content: { parts: [{ text: 'Generated text' }] },
          finishReason: 'STOP',
        },
      ],
      usageMetadata: {
        promptTokenCount: 10,
        candidatesTokenCount: 20,
        totalTokenCount: 30,
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await googleProvider.generate('test prompt', {
      apiKey: 'AIzatest123456789012345',
    });

    expect(result.content).toBe('Generated text');
    expect(result.provider).toBe('google');
    expect(result.usage?.promptTokens).toBe(10);
    expect(result.usage?.completionTokens).toBe(20);
  });

  it('handles system messages', async () => {
    const mockResponse = {
      candidates: [
        {
          content: { parts: [{ text: 'Response' }] },
          finishReason: 'STOP',
        },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    await googleProvider.generate('test prompt', {
      apiKey: 'AIzatest123456789012345',
      systemMessage: 'You are a helpful assistant',
    });

    const callArgs = (global.fetch as any).mock.calls[0];
    const body = JSON.parse(callArgs[1].body);
    expect(body.contents[0].role).toBe('user');
    expect(body.contents[0].parts[0].text).toBe('You are a helpful assistant');
    expect(body.contents[1].role).toBe('model');
  });

  it('supports streaming', async () => {
    const mockChunks = [
      'data: {"candidates":[{"content":{"parts":[{"text":"Hello"}]}}]}\n',
      'data: {"candidates":[{"content":{"parts":[{"text":" world"}]}}]}\n',
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
    for await (const chunk of googleProvider.generateStream!('test prompt', {
      apiKey: 'AIzatest123456789012345',
    })) {
      if (chunk.content) {
        chunks.push(chunk.content);
      }
    }

    expect(chunks).toEqual(['Hello', ' world']);
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
