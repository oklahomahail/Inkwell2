/**
 * AI Provider Registry
 *
 * Central registry of all available AI providers.
 * Makes it easy to list, select, and switch between providers.
 */

import { anthropicProvider } from './providers/anthropicProvider';
import { openaiProvider } from './providers/openaiProvider';
import { openrouterProvider } from './providers/openrouterProvider';
import { AIProvider } from './types';

/**
 * All available AI providers
 */
export const providers: AIProvider[] = [
  openrouterProvider, // Default - includes free models
  openaiProvider,
  anthropicProvider,
];

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
 * Get recommended provider for users without API keys
 */
export function getRecommendedFreeProvider(): AIProvider {
  return openrouterProvider; // Best free option with multiple models
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
