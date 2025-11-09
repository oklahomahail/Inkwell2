/**
 * OpenRouter Provider
 *
 * Unified gateway to 20+ AI providers (OpenAI, Anthropic, Google, Meta, etc.)
 * Supports both free models and paid models with user API keys.
 *
 * Benefits:
 * - Single API for multiple providers
 * - Free model access without individual API keys
 * - Automatic fallback to alternative providers
 * - Transparent pricing
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

const OPENROUTER_MODELS: AIModel[] = [
  // Free models
  {
    id: 'google/gemini-2.0-flash-exp:free',
    name: 'Gemini 2.0 Flash (Free)',
    description: "Google's latest multimodal model, free tier",
    isFree: true,
    contextWindow: 1048576,
    inputCost: null,
    outputCost: null,
    maxOutputTokens: 8192,
    supportsStreaming: true,
  },
  {
    id: 'meta-llama/llama-3.2-3b-instruct:free',
    name: 'Llama 3.2 3B (Free)',
    description: "Meta's open-source model, free tier",
    isFree: true,
    contextWindow: 131072,
    inputCost: null,
    outputCost: null,
    maxOutputTokens: 8192,
    supportsStreaming: true,
  },
  {
    id: 'mistralai/mistral-7b-instruct:free',
    name: 'Mistral 7B (Free)',
    description: 'Efficient open-source model, free tier',
    isFree: true,
    contextWindow: 32768,
    inputCost: null,
    outputCost: null,
    maxOutputTokens: 8192,
    supportsStreaming: true,
  },

  // Premium models (via OpenRouter with user key)
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o (via OpenRouter)',
    description: 'OpenAI flagship model via OpenRouter',
    isFree: false,
    contextWindow: 128000,
    inputCost: 2.5,
    outputCost: 10.0,
    maxOutputTokens: 16384,
    supportsStreaming: true,
  },
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet (via OpenRouter)',
    description: 'Anthropic flagship model via OpenRouter',
    isFree: false,
    contextWindow: 200000,
    inputCost: 3.0,
    outputCost: 15.0,
    maxOutputTokens: 8192,
    supportsStreaming: true,
  },
  {
    id: 'google/gemini-pro-1.5',
    name: 'Gemini Pro 1.5 (via OpenRouter)',
    description: "Google's advanced multimodal model",
    isFree: false,
    contextWindow: 2097152,
    inputCost: 1.25,
    outputCost: 5.0,
    maxOutputTokens: 8192,
    supportsStreaming: true,
  },
  {
    id: 'x-ai/grok-beta',
    name: 'Grok Beta (via OpenRouter)',
    description: "xAI's model with real-time knowledge",
    isFree: false,
    contextWindow: 131072,
    inputCost: 5.0,
    outputCost: 15.0,
    maxOutputTokens: 4096,
    supportsStreaming: true,
  },
];

function handleOpenRouterError(status: number, error: any): AIProviderError {
  const message = error?.error?.message || 'Unknown error';

  switch (status) {
    case 401:
      return new AIKeyError('openrouter', 'Invalid OpenRouter API key');
    case 429:
      return new AIRateLimitError('openrouter', message);
    case 402:
      return new AIQuotaError('openrouter', 'Insufficient credits');
    default:
      return new AIProviderError(message, 'openrouter');
  }
}

export const openrouterProvider: AIProvider = {
  id: 'openrouter',
  name: 'OpenRouter',
  description: 'Access 20+ AI models through one API (includes free models)',
  requiresKey: false, // Optional - works with free models without key
  models: OPENROUTER_MODELS,
  defaultModel: 'google/gemini-2.0-flash-exp:free',

  validateKey(key: string): boolean {
    return /^sk-or-[A-Za-z0-9-_]+$/.test(key);
  },

  async generate(prompt: string, options?: AIGenerateOptions): Promise<AIGenerateResult> {
    const apiKey = options?.apiKey || import.meta.env.VITE_OPENROUTER_KEY;

    // For free models, no key is strictly required, but OpenRouter recommends one for rate limiting
    const model = options?.model || this.defaultModel;
    const temperature = options?.temperature ?? 0.7;
    const maxTokens = options?.maxTokens ?? 2048;

    const messages = [];
    if (options?.systemMessage) {
      messages.push({ role: 'system', content: options.systemMessage });
    }
    messages.push({ role: 'user', content: prompt });

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://inkwell.app',
        'X-Title': 'Inkwell',
      };

      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers,
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
        throw handleOpenRouterError(response.status, error);
      }

      const data = await response.json();

      return {
        content: data.choices[0].message.content,
        provider: 'openrouter',
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
        error instanceof Error ? error.message : 'OpenRouter request failed',
        'openrouter',
      );
    }
  },

  async *generateStream(prompt: string, options?: AIGenerateOptions): AsyncIterable<AIStreamChunk> {
    const apiKey = options?.apiKey || import.meta.env.VITE_OPENROUTER_KEY;

    const model = options?.model || this.defaultModel;
    const temperature = options?.temperature ?? 0.7;
    const maxTokens = options?.maxTokens ?? 2048;

    const messages = [];
    if (options?.systemMessage) {
      messages.push({ role: 'system', content: options.systemMessage });
    }
    messages.push({ role: 'user', content: prompt });

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://inkwell.app',
        'X-Title': 'Inkwell',
      };

      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers,
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
        throw handleOpenRouterError(response.status, error);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new AIProviderError('No response body', 'openrouter');
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
        error instanceof Error ? error.message : 'OpenRouter streaming failed',
        'openrouter',
      );
    }
  },
};
