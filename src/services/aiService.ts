/**
 * AI Service
 *
 * Main service for AI text generation with multi-provider support.
 * Handles provider selection, API key management, streaming, and error handling.
 */

import { getProvider, requiresApiKey, getFreeModels } from '@/ai/registry';
import {
  AIGenerateOptions,
  AIGenerateResult,
  AIStreamChunk,
  AIProviderError,
  AIKeyError,
} from '@/ai/types';

import { aiSettingsService } from './aiSettingsService';

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
      temperature: options?.temperature ?? aiSettingsService.getPreferences().temperature,
      maxTokens: options?.maxTokens ?? aiSettingsService.getPreferences().maxTokens,
      signal: options?.signal,
    };

    try {
      const result = await provider.generate(prompt, generateOptions);

      // Track usage
      if (result.usage && aiSettingsService.getPreferences().trackUsage) {
        aiSettingsService.updateUsage(
          providerId,
          result.usage.promptTokens,
          result.usage.completionTokens,
        );
      }

      return result;
    } catch (error) {
      return this.handleError(error, providerId, options);
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
      temperature: options?.temperature ?? aiSettingsService.getPreferences().temperature,
      maxTokens: options?.maxTokens ?? aiSettingsService.getPreferences().maxTokens,
      onStream: options?.onStream,
      signal: options?.signal,
    };

    try {
      let promptTokens = 0;
      let completionTokens = 0;

      for await (const chunk of provider.generateStream(prompt, generateOptions)) {
        if (chunk.usage) {
          promptTokens = chunk.usage.promptTokens || 0;
          completionTokens = chunk.usage.completionTokens || 0;
        }
        yield chunk;
      }

      // Track usage after completion
      if (aiSettingsService.getPreferences().trackUsage && (promptTokens || completionTokens)) {
        aiSettingsService.updateUsage(providerId, promptTokens, completionTokens);
      }
    } catch (error) {
      // For streaming, we need to handle errors differently
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
    const settings = aiSettingsService.getSettings();

    const providerId = options?.providerId || settings.defaultProvider;
    const modelId = options?.modelId || settings.defaultModel;

    // Get API key if provider requires it
    let apiKey: string | undefined;
    if (requiresApiKey(providerId, modelId)) {
      apiKey = aiSettingsService.getApiKey(providerId);
      if (!apiKey) {
        throw new AIKeyError(providerId, `API key required for ${providerId}`);
      }
    }

    return { providerId, modelId, apiKey };
  }

  /**
   * Handle errors with auto-fallback
   */
  private async handleError(
    error: unknown,
    providerId: string,
    options?: GenerateOptions,
  ): Promise<AIGenerateResult> {
    const settings = aiSettingsService.getSettings();

    // If auto-fallback is enabled and this was a key error, try free models
    if (settings.preferences.autoFallback && error instanceof AIKeyError) {
      console.warn(`${providerId} failed, falling back to free model...`);

      const freeModels = getFreeModels();
      if (freeModels.length > 0) {
        const fallback = freeModels[0];
        if (!fallback) {
          // No fallback available
          throw error;
        }

        const fallbackProvider = fallback.provider;

        try {
          const result = await fallbackProvider.generate(options?.systemMessage || '', {
            model: fallback.model.id,
            temperature: options?.temperature,
            maxTokens: options?.maxTokens,
            signal: options?.signal,
          });

          // Fallback successful - silently continue
          return result;
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError);
        }
      }
    }

    // Re-throw original error
    if (error instanceof AIProviderError) {
      throw error;
    }
    throw new AIProviderError(
      error instanceof Error ? error.message : 'AI generation failed',
      providerId,
    );
  }

  /**
   * Test provider configuration
   */
  async testProvider(
    providerId: string,
    apiKey?: string,
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    const provider = getProvider(providerId);
    if (!provider) {
      return { success: false, error: `Provider not found: ${providerId}` };
    }

    // Validate key format if provided
    if (apiKey && provider.validateKey && !provider.validateKey(apiKey)) {
      return { success: false, error: 'Invalid API key format' };
    }

    try {
      // Try a simple generation
      await provider.generate('Say "test successful" if you can read this.', {
        apiKey: apiKey || aiSettingsService.getApiKey(providerId),
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

  /**
   * Get available providers and their status
   */
  getProviderStatus() {
    const settings = aiSettingsService.getSettings();

    return {
      current: {
        providerId: settings.defaultProvider,
        modelId: settings.defaultModel,
      },
      hasKeys: Object.keys(settings.apiKeys).filter((key) => settings.apiKeys[key]),
      usage: settings.usage,
      preferences: settings.preferences,
    };
  }
}

export const aiService = new AIService();
