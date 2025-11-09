/**
 * AI Service - Simplified Version
 *
 * Main service for AI text generation with multi-provider support.
 * Uses environment variables for API keys (baseline version).
 */

import { getApiKey } from '@/ai/config';
import { getProvider, getDefaultProviderAndModel } from '@/ai/registry';
import {
  AIGenerateOptions,
  AIGenerateResult,
  AIStreamChunk,
  AIProviderError,
  AIKeyError,
} from '@/ai/types';

export interface GenerateOptions {
  /** Override default provider */
  providerId?: string;
  /** Override default model */
  modelId?: string;
  /** System message/context */
  systemMessage?: string;
  /** Temperature (0-2) */
  temperature?: number;
  /** Max tokens to generate */
  maxTokens?: number;
  /** Enable streaming */
  stream?: boolean;
  /** Streaming callback */
  onStream?: (chunk: AIStreamChunk) => void;
  /** Abort signal */
  signal?: AbortSignal;
}

class AIService {
  /**
   * Generate text from prompt
   */
  async generate(prompt: string, options?: GenerateOptions): Promise<AIGenerateResult> {
    const { providerId, modelId, apiKey } = this.getProviderConfig(options);
    const provider = getProvider(providerId);

    if (!provider) {
      throw new AIProviderError(`Provider not found: ${providerId}`, providerId);
    }

    const generateOptions: AIGenerateOptions = {
      apiKey,
      model: modelId,
      systemMessage: options?.systemMessage,
      temperature: options?.temperature ?? 0.7,
      maxTokens: options?.maxTokens ?? 2048,
      signal: options?.signal,
    };

    try {
      const result = await provider.generate(prompt, generateOptions);
      return result;
    } catch (error) {
      if (error instanceof AIProviderError) {
        throw error;
      }
      throw new AIProviderError(
        error instanceof Error ? error.message : 'AI generation failed',
        providerId,
      );
    }
  }

  /**
   * Generate text with streaming
   */
  async *generateStream(prompt: string, options?: GenerateOptions): AsyncIterable<AIStreamChunk> {
    const { providerId, modelId, apiKey } = this.getProviderConfig(options);
    const provider = getProvider(providerId);

    if (!provider) {
      throw new AIProviderError(`Provider not found: ${providerId}`, providerId);
    }

    if (!provider.generateStream) {
      throw new AIProviderError(`Provider does not support streaming: ${providerId}`, providerId);
    }

    const generateOptions: AIGenerateOptions = {
      apiKey,
      model: modelId,
      systemMessage: options?.systemMessage,
      temperature: options?.temperature ?? 0.7,
      maxTokens: options?.maxTokens ?? 2048,
      onStream: options?.onStream,
      signal: options?.signal,
    };

    try {
      for await (const chunk of provider.generateStream(prompt, generateOptions)) {
        yield chunk;
      }
    } catch (error) {
      if (error instanceof AIProviderError) {
        throw error;
      }
      throw new AIProviderError(
        error instanceof Error ? error.message : 'Streaming failed',
        providerId,
      );
    }
  }

  /**
   * Get provider configuration (provider, model, API key)
   */
  private getProviderConfig(options?: GenerateOptions): {
    providerId: string;
    modelId: string;
    apiKey?: string;
  } {
    const defaults = getDefaultProviderAndModel();
    const providerId = options?.providerId || defaults.providerId;
    const modelId = options?.modelId || defaults.modelId;

    // Get API key from environment
    const apiKey = getApiKey(providerId);
    if (!apiKey) {
      throw new AIKeyError(
        providerId,
        `API key not found for ${providerId} - check environment variables`,
      );
    }

    return { providerId, modelId, apiKey };
  }

  /**
   * Test provider configuration
   */
  async testProvider(providerId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    const provider = getProvider(providerId);
    if (!provider) {
      return { success: false, error: `Provider not found: ${providerId}` };
    }

    const apiKey = getApiKey(providerId);
    if (!apiKey) {
      return { success: false, error: 'API key not configured in environment' };
    }

    // Validate key format
    if (provider.validateKey && !provider.validateKey(apiKey)) {
      return { success: false, error: 'Invalid API key format' };
    }

    try {
      // Try a simple generation
      await provider.generate('Say "test successful" if you can read this.', {
        apiKey,
        model: provider.defaultModel,
        maxTokens: 10,
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Test failed',
      };
    }
  }
}

export const aiService = new AIService();
