/**
 * AI Provider Registry - Simplified Curated Models
 *
 * Curated list of 7 high-quality models from 3 major providers.
 * This baseline version focuses on simplicity while maintaining quality.
 */

import { anthropicProvider } from './providers/anthropicProvider';
import { googleProvider } from './providers/googleProvider';
import { openaiProvider } from './providers/openaiProvider';
import { AIProvider, AIModel } from './types';

/**
 * Curated list of models (Baseline Mode)
 *
 * OpenAI: 3 models (fast, balanced, deep reasoning)
 * Anthropic: 2 models (fast, strong reasoning)
 * Google: 2 models (low latency, high capability)
 */
export const CURATED_MODELS = {
  openai: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo'],
  anthropic: ['claude-3-haiku-20240307', 'claude-3-5-sonnet-20241022'],
  google: ['gemini-1.5-flash', 'gemini-1.5-pro'],
} as const;

/**
 * Extended models (Advanced Mode)
 *
 * Additional experimental and specialized models
 */
export const EXTENDED_MODELS = {
  openai: ['gpt-4-turbo-preview', 'gpt-3.5-turbo'],
  anthropic: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229'],
  google: ['gemini-pro', 'gemini-pro-vision'],
} as const;

/**
 * All available AI providers (Baseline: OpenAI, Anthropic, Google)
 */
export const providers: AIProvider[] = [openaiProvider, anthropicProvider, googleProvider];

/**
 * Get provider by ID
 */
export function getProvider(id: string): AIProvider | undefined {
  return providers.find((p) => p.id === id);
}

/**
 * Get all provider IDs
 */
export function getProviderIds(): string[] {
  return providers.map((p) => p.id);
}

/**
 * Get all free models across all providers
 */
export function getFreeModels() {
  return providers.flatMap((provider) =>
    provider.models.filter((model) => model.isFree).map((model) => ({ provider, model })),
  );
}

/**
 * Get all models that require API keys
 */
export function getPaidModels() {
  return providers.flatMap((provider) =>
    provider.models.filter((model) => !model.isFree).map((model) => ({ provider, model })),
  );
}

/**
 * Get curated models list with provider info
 */
export function getCuratedModels(): Array<{
  provider: AIProvider;
  model: AIModel;
}> {
  const curated: Array<{ provider: AIProvider; model: AIModel }> = [];

  for (const [providerId, modelIds] of Object.entries(CURATED_MODELS)) {
    const provider = getProvider(providerId);
    if (!provider) continue;

    for (const modelId of modelIds) {
      const model = provider.models.find((m) => m.id === modelId);
      if (model) {
        curated.push({ provider, model });
      }
    }
  }

  return curated;
}

/**
 * Get all models (curated + extended) based on advanced mode
 */
export function getModels(includeAdvanced = false): Array<{
  provider: AIProvider;
  model: AIModel;
}> {
  const curated = getCuratedModels();

  if (!includeAdvanced) {
    return curated;
  }

  // Add extended models for advanced mode
  const extended: Array<{ provider: AIProvider; model: AIModel }> = [];

  for (const [providerId, modelIds] of Object.entries(EXTENDED_MODELS)) {
    const provider = getProvider(providerId);
    if (!provider) continue;

    for (const modelId of modelIds) {
      const model = provider.models.find((m) => m.id === modelId);
      if (model) {
        extended.push({ provider, model });
      }
    }
  }

  return [...curated, ...extended];
}

/**
 * Get default provider and model (first in curated list)
 */
export function getDefaultProviderAndModel(): {
  providerId: string;
  modelId: string;
} {
  return {
    providerId: 'openai',
    modelId: 'gpt-4o-mini',
  };
}

/**
 * Get model by provider and model ID
 */
export function getModel(providerId: string, modelId: string) {
  const provider = getProvider(providerId);
  if (!provider) return undefined;

  const model = provider.models.find((m) => m.id === modelId);
  return model ? { provider, model } : undefined;
}

/**
 * Validate if a provider requires an API key
 */
export function requiresApiKey(providerId: string, modelId?: string): boolean {
  const provider = getProvider(providerId);
  if (!provider) return false;

  // Check if specific model is free
  if (modelId) {
    const model = provider.models.find((m) => m.id === modelId);
    if (model?.isFree) return false;
  }

  return provider.requiresKey;
}
