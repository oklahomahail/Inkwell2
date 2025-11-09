/**
 * Anthropic Provider
 *
 * Adapter for Anthropic's Claude models.
 * Supports Claude 3.5 Sonnet, Claude 3 Opus, and Claude 3 Haiku.
 */

import {
  AIProvider,
  AIModel,
  AIGenerateOptions,
  AIGenerateResult,
  AIStreamChunk,
  AIKeyError,
  AIRateLimitError,
  AIQuotaError,
  AIProviderError,
} from '../types';

const ANTHROPIC_MODELS: AIModel[] = [
  {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    description: 'Most intelligent model, best for complex tasks',
    isFree: false,
    contextWindow: 200000,
    inputCost: 3.0,
    outputCost: 15.0,
    maxOutputTokens: 8192,
    supportsStreaming: true,
  },
  {
    id: 'claude-3-opus-20240229',
    name: 'Claude 3 Opus',
    description: 'Powerful model for highly complex tasks',
    isFree: false,
    contextWindow: 200000,
    inputCost: 15.0,
    outputCost: 75.0,
    maxOutputTokens: 4096,
    supportsStreaming: true,
  },
  {
    id: 'claude-3-haiku-20240307',
    name: 'Claude 3 Haiku',
    description: 'Fastest and most compact model',
    isFree: false,
    contextWindow: 200000,
    inputCost: 0.25,
    outputCost: 1.25,
    maxOutputTokens: 4096,
    supportsStreaming: true,
  },
];

function handleAnthropicError(status: number, error: any): AIProviderError {
  const message = error?.error?.message || 'Unknown error';

  switch (status) {
    case 401:
      return new AIKeyError('anthropic', 'Invalid Anthropic API key');
    case 429:
      return new AIRateLimitError('anthropic', message);
    case 403:
      return new AIQuotaError('anthropic', message);
    default:
      return new AIProviderError(message, 'anthropic');
  }
}

export const anthropicProvider: AIProvider = {
  id: 'anthropic',
  name: 'Anthropic',
  description: 'Claude models from Anthropic',
  requiresKey: true,
  models: ANTHROPIC_MODELS,
  defaultModel: 'claude-3-5-sonnet-20241022',

  validateKey(key: string): boolean {
    return /^sk-ant-[A-Za-z0-9-_]+$/.test(key);
  },

  async generate(prompt: string, options?: AIGenerateOptions): Promise<AIGenerateResult> {
    const apiKey = options?.apiKey || import.meta.env.VITE_ANTHROPIC_KEY;
    if (!apiKey) {
      throw new AIKeyError('anthropic', 'Anthropic API key required');
    }

    const model = options?.model || this.defaultModel;
    const temperature = options?.temperature ?? 0.7;
    const maxTokens = options?.maxTokens ?? 2048;

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          ...(options?.systemMessage && { system: options.systemMessage }),
          temperature,
          max_tokens: maxTokens,
          stream: false,
        }),
        signal: options?.signal,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
        throw handleAnthropicError(response.status, error);
      }

      const data = await response.json();

      return {
        content: data.content[0].text,
        provider: 'anthropic',
        model,
        usage: {
          promptTokens: data.usage?.input_tokens || 0,
          completionTokens: data.usage?.output_tokens || 0,
          totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
        },
        finishReason: data.stop_reason,
      };
    } catch (error) {
      if (error instanceof AIProviderError) {
        throw error;
      }
      throw new AIProviderError(
        error instanceof Error ? error.message : 'Anthropic request failed',
        'anthropic',
      );
    }
  },

  async *generateStream(prompt: string, options?: AIGenerateOptions): AsyncIterable<AIStreamChunk> {
    const apiKey = options?.apiKey || import.meta.env.VITE_ANTHROPIC_KEY;
    if (!apiKey) {
      throw new AIKeyError('anthropic', 'Anthropic API key required');
    }

    const model = options?.model || this.defaultModel;
    const temperature = options?.temperature ?? 0.7;
    const maxTokens = options?.maxTokens ?? 2048;

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          ...(options?.systemMessage && { system: options.systemMessage }),
          temperature,
          max_tokens: maxTokens,
          stream: true,
        }),
        signal: options?.signal,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
        throw handleAnthropicError(response.status, error);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new AIProviderError('No response body', 'anthropic');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);

            try {
              const parsed = JSON.parse(data);

              if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
                const content = parsed.delta.text;
                yield { content, isComplete: false };
                options?.onStream?.({ content, isComplete: false });
              }

              if (parsed.type === 'message_stop') {
                yield { content: '', isComplete: true };
                return;
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof AIProviderError) {
        throw error;
      }
      throw new AIProviderError(
        error instanceof Error ? error.message : 'Anthropic streaming failed',
        'anthropic',
      );
    }
  },
};
