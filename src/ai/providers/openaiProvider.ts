/**
 * OpenAI Provider
 *
 * Adapter for OpenAI's GPT models.
 * Supports GPT-4o, GPT-4, GPT-3.5, and free gpt-4o-mini.
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

const OPENAI_MODELS: AIModel[] = [
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini (Free)',
    description: 'Fast, affordable model for everyday tasks',
    isFree: true,
    contextWindow: 128000,
    inputCost: null,
    outputCost: null,
    maxOutputTokens: 16384,
    supportsStreaming: true,
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    description: 'High intelligence flagship model for complex tasks',
    isFree: false,
    contextWindow: 128000,
    inputCost: 2.5,
    outputCost: 10.0,
    maxOutputTokens: 16384,
    supportsStreaming: true,
  },
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    description: 'Previous generation flagship model',
    isFree: false,
    contextWindow: 128000,
    inputCost: 10.0,
    outputCost: 30.0,
    maxOutputTokens: 4096,
    supportsStreaming: true,
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    description: 'Fast and affordable for simple tasks',
    isFree: false,
    contextWindow: 16384,
    inputCost: 0.5,
    outputCost: 1.5,
    maxOutputTokens: 4096,
    supportsStreaming: true,
  },
];

function handleOpenAIError(status: number, error: any): AIProviderError {
  const message = error?.error?.message || 'Unknown error';

  switch (status) {
    case 401:
      return new AIKeyError('openai', 'Invalid OpenAI API key');
    case 429:
      return new AIRateLimitError('openai', message);
    case 403:
      return new AIQuotaError('openai', message);
    default:
      return new AIProviderError(message, 'openai');
  }
}

export const openaiProvider: AIProvider = {
  id: 'openai',
  name: 'OpenAI',
  description: 'GPT models from OpenAI (includes free gpt-4o-mini)',
  requiresKey: true,
  models: OPENAI_MODELS,
  defaultModel: 'gpt-4o-mini',

  validateKey(key: string): boolean {
    return /^sk-[A-Za-z0-9-_]+$/.test(key);
  },

  async generate(prompt: string, options?: AIGenerateOptions): Promise<AIGenerateResult> {
    const apiKey = options?.apiKey || import.meta.env.VITE_OPENAI_KEY;
    if (!apiKey) {
      throw new AIKeyError('openai', 'OpenAI API key required');
    }

    const model = options?.model || this.defaultModel;
    const temperature = options?.temperature ?? 0.7;
    const maxTokens = options?.maxTokens ?? 2048;

    const messages = [];
    if (options?.systemMessage) {
      messages.push({ role: 'system', content: options.systemMessage });
    }
    messages.push({ role: 'user', content: prompt });

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
          stream: false,
        }),
        signal: options?.signal,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
        throw handleOpenAIError(response.status, error);
      }

      const data = await response.json();

      return {
        content: data.choices[0].message.content,
        provider: 'openai',
        model,
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0,
        },
        finishReason: data.choices[0].finish_reason,
      };
    } catch (error) {
      if (error instanceof AIProviderError) {
        throw error;
      }
      throw new AIProviderError(
        error instanceof Error ? error.message : 'OpenAI request failed',
        'openai',
      );
    }
  },

  async *generateStream(prompt: string, options?: AIGenerateOptions): AsyncIterable<AIStreamChunk> {
    const apiKey = options?.apiKey || import.meta.env.VITE_OPENAI_KEY;
    if (!apiKey) {
      throw new AIKeyError('openai', 'OpenAI API key required');
    }

    const model = options?.model || this.defaultModel;
    const temperature = options?.temperature ?? 0.7;
    const maxTokens = options?.maxTokens ?? 2048;

    const messages = [];
    if (options?.systemMessage) {
      messages.push({ role: 'system', content: options.systemMessage });
    }
    messages.push({ role: 'user', content: prompt });

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
          stream: true,
        }),
        signal: options?.signal,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
        throw handleOpenAIError(response.status, error);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new AIProviderError('No response body', 'openai');
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
            if (data === '[DONE]') {
              yield { content: '', isComplete: true };
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices[0]?.delta?.content;
              if (delta) {
                yield { content: delta, isComplete: false };
                options?.onStream?.({ content: delta, isComplete: false });
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
        error instanceof Error ? error.message : 'OpenAI streaming failed',
        'openai',
      );
    }
  },
};
