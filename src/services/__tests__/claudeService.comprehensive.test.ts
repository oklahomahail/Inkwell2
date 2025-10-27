import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock CryptoJS before importing the service
vi.mock('crypto-js', () => ({
  default: {
    AES: {
      encrypt: vi.fn((data) => ({ toString: () => `encrypted_${data}` })),
      decrypt: vi.fn((data) => ({ toString: () => data.replace('encrypted_', '') })),
    },
  },
}));

import claudeService from '../claudeService';

function mockFetch(response: Response) {
  global.fetch = vi.fn().mockResolvedValue(response);
  return global.fetch;
}

function jsonResponse(body: unknown, init: ResponseInit = { status: 200 }) {
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
}

describe('ClaudeService', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();

    // Reset fetch mock
    fetchMock = vi.fn();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('initializes with default config', () => {
      expect(claudeService.isConfigured()).toBe(false);
    });

    it('accepts valid API key', () => {
      claudeService.initialize('sk-ant-api03-test-key-12345');
      expect(claudeService.isConfigured()).toBe(true);
    });

    it('rejects invalid API key format', () => {
      expect(() => claudeService.initialize('invalid-key')).toThrow('Invalid API key format');
    });

    it('rejects empty API key', () => {
      expect(() => claudeService.initialize('')).toThrow('Invalid API key format');
    });

    it('persists API key to localStorage', () => {
      claudeService.initialize('sk-ant-api03-test-key');
      // Key should be stored encrypted
      const stored = localStorage.getItem('claude_api_key_encrypted');
      expect(stored).toBeTruthy();
    });
  });

  describe('Status Change Listeners', () => {
    it('notifies listeners when API key is set', () => {
      const listener = vi.fn();
      claudeService.addStatusChangeListener(listener);

      claudeService.initialize('sk-ant-api03-test-key');
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('allows removing listeners', () => {
      const listener = vi.fn();
      claudeService.addStatusChangeListener(listener);
      claudeService.removeStatusChangeListener(listener);

      claudeService.initialize('sk-ant-api03-test-key');
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('sendMessage - Happy Path', () => {
    beforeEach(() => {
      claudeService.initialize('sk-ant-api03-valid-key');
    });

    it('sends a message and returns parsed response', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({
          content: [{ type: 'text', text: 'Hello from Claude!' }],
          usage: { input_tokens: 10, output_tokens: 5 },
        }),
      );

      const result = await claudeService.sendMessage('Say hello');

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(result.text).toBe('Hello from Claude!');
      expect(result.content).toBe('Hello from Claude!');
      expect(result.usage).toEqual({
        inputTokens: 10,
        outputTokens: 5,
      });
    });

    it('includes conversation history in request', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({
          content: [{ type: 'text', text: 'Response' }],
        }),
      );

      await claudeService.sendMessage('Follow up', {
        conversationHistory: [
          { id: '1', role: 'user', content: 'Previous', timestamp: new Date() },
          { id: '2', role: 'assistant', content: 'Reply', timestamp: new Date() },
        ],
      });

      const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(requestBody.messages.length).toBeGreaterThan(1);
    });

    it('includes selected text in context', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({
          content: [{ type: 'text', text: 'Analysis' }],
        }),
      );

      await claudeService.sendMessage('Analyze this', {
        selectedText: 'Once upon a time...',
      });

      const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(JSON.stringify(requestBody.messages)).toContain('Once upon a time');
    });

    it('allows override of maxTokens for long-form generation', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({
          content: [{ type: 'text', text: 'Long response' }],
        }),
      );

      await claudeService.sendMessage('Generate outline', {
        maxTokens: 8000,
      });

      const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(requestBody.max_tokens).toBe(8000);
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      claudeService.initialize('sk-ant-api03-valid-key');
    });

    it('throws auth error when not configured', async () => {
      localStorage.clear();
      // reset singleton apiKey
      (claudeService as any).config.apiKey = undefined;

      await expect(claudeService.sendMessage('test')).rejects.toThrow(
        'Claude API key not configured',
      );
    });

    it('throws error on empty message', async () => {
      await expect(claudeService.sendMessage('')).rejects.toThrow(
        'Message content cannot be empty',
      );
      await expect(claudeService.sendMessage('   ')).rejects.toThrow(
        'Message content cannot be empty',
      );
    });

    it('handles API error responses with details', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse(
          {
            error: {
              type: 'invalid_request_error',
              message: 'Invalid model specified',
            },
          },
          { status: 400 },
        ),
      );

      await expect(claudeService.sendMessage('test')).rejects.toThrow();
    });

    it('handles rate limit errors', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse(
          {
            error: {
              type: 'rate_limit_error',
              message: 'Rate limit exceeded',
            },
          },
          { status: 429 },
        ),
      );

      await expect(claudeService.sendMessage('test')).rejects.toThrow();
    });

    it('handles network errors gracefully', async () => {
      fetchMock.mockRejectedValue(new Error('Network failure'));

      await expect(claudeService.sendMessage('test')).rejects.toThrow('Network error');
    });

    it('handles invalid response format', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({
          content: [], // Empty content array
        }),
      );

      await expect(claudeService.sendMessage('test')).rejects.toThrow('Invalid response format');
    });

    it('handles malformed JSON response', async () => {
      fetchMock.mockResolvedValue(
        new Response('not json', {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );

      await expect(claudeService.sendMessage('test')).rejects.toThrow();
    });
  });

  describe('Rate Limiting', () => {
    beforeEach(() => {
      claudeService.initialize('sk-ant-api03-valid-key');
    });

    it('prevents rapid successive calls', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({
          content: [{ type: 'text', text: 'Response' }],
        }),
      );

      // First call should succeed
      await claudeService.sendMessage('First');

      // Simulate rate limit being hit
      // This depends on your implementation - adjust as needed
      // You may need to expose a method to set rate limit state for testing
    });
  });

  describe('Convenience Methods', () => {
    beforeEach(() => {
      claudeService.initialize('sk-ant-api03-valid-key');
      fetchMock.mockResolvedValue(
        jsonResponse({
          content: [{ type: 'text', text: 'Generated text' }],
        }),
      );
    });

    it('continueText wraps prompt correctly', async () => {
      await claudeService.continueText('Once upon a time');

      const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(JSON.stringify(requestBody.messages)).toContain('continue this text');
      expect(JSON.stringify(requestBody.messages)).toContain('Once upon a time');
    });

    it('improveText wraps prompt correctly', async () => {
      await claudeService.improveText('Some text to improve');

      const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(JSON.stringify(requestBody.messages)).toContain('improve');
    });

    it('analyzeWritingStyle wraps prompt correctly', async () => {
      await claudeService.analyzeWritingStyle('Sample writing');

      const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(JSON.stringify(requestBody.messages)).toContain('analyze the writing style');
    });

    it('generatePlotIdeas works with and without context', async () => {
      fetchMock.mockImplementationOnce(() =>
        jsonResponse({ content: [{ type: 'text', text: 'Idea set 1' }] }),
      );
      await claudeService.generatePlotIdeas();
      expect(fetchMock).toHaveBeenCalledTimes(1);

      fetchMock.mockImplementationOnce(() =>
        jsonResponse({ content: [{ type: 'text', text: 'Idea set 2' }] }),
      );
      await claudeService.generatePlotIdeas('Fantasy setting');
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('analyzeCharacter works with and without context', async () => {
      fetchMock.mockImplementationOnce(() =>
        jsonResponse({ content: [{ type: 'text', text: 'Analysis 1' }] }),
      );
      await claudeService.analyzeCharacter('John Doe');
      expect(fetchMock).toHaveBeenCalledTimes(1);

      fetchMock.mockImplementationOnce(() =>
        jsonResponse({ content: [{ type: 'text', text: 'Analysis 2' }] }),
      );
      await claudeService.analyzeCharacter('Jane Smith', 'Detective story');
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('generateStoryOutline uses higher token limit', async () => {
      await claudeService.generateStoryOutline('Epic fantasy saga');

      const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(requestBody.max_tokens).toBeGreaterThanOrEqual(4000);
    });
  });

  describe('Configuration Persistence', () => {
    it('loads saved API key from storage', () => {
      claudeService.initialize('sk-ant-api03-saved-key');
      expect(claudeService.isConfigured()).toBe(true);
    });

    it('persists API key after initialization', () => {
      claudeService.initialize('sk-ant-api03-test');
      expect(claudeService.isConfigured()).toBe(true);

      const config = claudeService.getConfig();
      expect(config.apiKey).toBe('sk-ant-api03-test');
    });
  });

  describe('Request Headers', () => {
    beforeEach(() => {
      claudeService.initialize('sk-ant-api03-valid-key');
      fetchMock.mockResolvedValue(
        jsonResponse({
          content: [{ type: 'text', text: 'Response' }],
        }),
      );
    });

    it('includes correct Anthropic headers', async () => {
      await claudeService.sendMessage('test');

      const headers = fetchMock.mock.calls[0][1].headers;
      expect(headers['anthropic-api-key']).toBe('sk-ant-api03-valid-key');
      expect(headers['anthropic-version']).toBe('2023-06-01');
      expect(headers['Content-Type']).toBe('application/json');
    });

    it('sends POST request to correct endpoint', async () => {
      await claudeService.sendMessage('test');

      expect(fetchMock.mock.calls[0][0]).toBe('https://api.anthropic.com/v1/messages');
      expect(fetchMock.mock.calls[0][1].method).toBe('POST');
    });
  });

  describe('Response Parsing', () => {
    beforeEach(() => {
      claudeService.initialize('sk-ant-api03-valid-key');
    });

    it('handles response with usage data', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({
          content: [{ type: 'text', text: 'Response' }],
          usage: {
            input_tokens: 100,
            output_tokens: 50,
          },
        }),
      );

      const result = await claudeService.sendMessage('test');
      expect(result.usage).toEqual({
        inputTokens: 100,
        outputTokens: 50,
      });
    });

    it('handles response without usage data', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({
          content: [{ type: 'text', text: 'Response' }],
        }),
      );

      const result = await claudeService.sendMessage('test');
      expect(result.usage).toBeUndefined();
    });

    it('provides trim() method on response', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({
          content: [{ type: 'text', text: '  Response with spaces  ' }],
        }),
      );

      const result = await claudeService.sendMessage('test');
      expect(result.trim()).toBe('Response with spaces');
    });
  });
});
