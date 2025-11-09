/**
 * Google Gemini Provider
 *
 * Implements Google's Gemini AI models with streaming support.
 */

import {
  AIProvider,
  AIModel,
  AIGenerateOptions,
  AIGenerateResult,
  AIStreamChunk,
  AIProviderError,
  AIKeyError,
  AIRateLimitError,
  AIQuotaError,
} from '../types';

const GOOGLE_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

function handleGoogleError(status: number, error: any): AIProviderError {
  const message = error?.error?.message || 'Unknown error';

  switch (status) {
    case 401:
      return new AIKeyError('google', 'Invalid Google API key');
    case 429:
      return new AIRateLimitError('google', message);
    case 403:
      return new AIQuotaError('google', message);
    default:
      return new AIProviderError(message, 'google');
  }
}

const googleModels: AIModel[] = [
  {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    description: 'Fast and versatile performance across diverse tasks',
    contextWindow: 1000000,
    maxOutputTokens: 8192,
    supportsStreaming: true,
    isFree: false,
    inputCost: 0.075, // per 1M tokens
    outputCost: 0.3,
  },
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    description: 'Complex reasoning tasks requiring deep understanding',
    contextWindow: 2000000,
    maxOutputTokens: 8192,
    supportsStreaming: true,
    isFree: false,
    inputCost: 1.25, // per 1M tokens
    outputCost: 5.0,
  },
];

export const googleProvider: AIProvider = {
  id: 'google',
  name: 'Google AI',
  description: 'Google Gemini models with large context windows',
  requiresKey: true,
  models: googleModels,
  defaultModel: 'gemini-1.5-flash',

  validateKey(key: string): boolean {
    // Google API keys start with AIza
    return /^AIza[A-Za-z0-9-_]+$/.test(key);
  },

  async generate(prompt: string, options?: AIGenerateOptions): Promise<AIGenerateResult> {
    const apiKey = options?.apiKey;
    if (!apiKey) {
      throw new AIKeyError('google', 'API key is required for Google AI');
    }

    const model = options?.model || this.defaultModel;
    const url = `${GOOGLE_API_BASE}/models/${model}:generateContent?key=${apiKey}`;

    const contents = [];
    if (options?.systemMessage) {
      contents.push({
        role: 'user',
        parts: [{ text: options.systemMessage }],
      });
      contents.push({
        role: 'model',
        parts: [{ text: 'Understood. I will follow these instructions.' }],
      });
    }
    contents.push({
      role: 'user',
      parts: [{ text: prompt }],
    });

    const requestBody = {
      contents,
      generationConfig: {
        temperature: options?.temperature ?? 0.7,
        maxOutputTokens: options?.maxTokens ?? 2048,
      },
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: options?.signal,
      });

      if (!response.ok) {
        const error = await response.json();
        throw handleGoogleError(response.status, error);
      }

      const data = await response.json();

      if (!data.candidates || data.candidates.length === 0) {
        throw new AIProviderError('No response from Google AI', 'google');
      }

      const content = data.candidates[0].content.parts[0].text;
      const usage = data.usageMetadata
        ? {
            promptTokens: data.usageMetadata.promptTokenCount || 0,
            completionTokens: data.usageMetadata.candidatesTokenCount || 0,
            totalTokens: data.usageMetadata.totalTokenCount || 0,
          }
        : undefined;

      return {
        content,
        provider: this.id,
        model,
        finishReason: data.candidates[0].finishReason?.toLowerCase() || 'stop',
        usage,
      };
    } catch (error) {
      if (error instanceof AIProviderError) {
        throw error;
      }
      throw new AIProviderError(
        error instanceof Error ? error.message : 'Google AI request failed',
        'google',
      );
    }
  },

  async *generateStream(prompt: string, options?: AIGenerateOptions): AsyncIterable<AIStreamChunk> {
    const apiKey = options?.apiKey;
    if (!apiKey) {
      throw new AIKeyError('google', 'API key is required for Google AI');
    }

    const model = options?.model || this.defaultModel;
    const url = `${GOOGLE_API_BASE}/models/${model}:streamGenerateContent?key=${apiKey}&alt=sse`;

    const contents = [];
    if (options?.systemMessage) {
      contents.push({
        role: 'user',
        parts: [{ text: options.systemMessage }],
      });
      contents.push({
        role: 'model',
        parts: [{ text: 'Understood. I will follow these instructions.' }],
      });
    }
    contents.push({
      role: 'user',
      parts: [{ text: prompt }],
    });

    const requestBody = {
      contents,
      generationConfig: {
        temperature: options?.temperature ?? 0.7,
        maxOutputTokens: options?.maxTokens ?? 2048,
      },
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: options?.signal,
      });

      if (!response.ok) {
        const error = await response.json();
        throw handleGoogleError(response.status, error);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new AIProviderError('No response stream available', 'google');
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
              yield {
                content: '',
                isComplete: true,
                provider: this.id,
                model,
              };
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const candidate = parsed.candidates?.[0];
              if (!candidate) continue;

              const text = candidate.content?.parts?.[0]?.text;
              if (text) {
                const chunk: AIStreamChunk = {
                  content: text,
                  isComplete: false,
                  provider: this.id,
                  model,
                };

                if (parsed.usageMetadata) {
                  chunk.usage = {
                    promptTokens: parsed.usageMetadata.promptTokenCount || 0,
                    completionTokens: parsed.usageMetadata.candidatesTokenCount || 0,
                    totalTokens: parsed.usageMetadata.totalTokenCount || 0,
                  };
                }

                if (options?.onStream) {
                  options.onStream(chunk);
                }

                yield chunk;
              }
            } catch (_e) {
              // Skip invalid JSON lines
              continue;
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof AIProviderError) {
        throw error;
      }
      throw new AIProviderError(
        error instanceof Error ? error.message : 'Google AI streaming failed',
        'google',
      );
    }
  },
};
