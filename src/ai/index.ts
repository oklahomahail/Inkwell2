/**
 * AI Provider System - Simplified Version
 *
 * Exports for the multi-provider AI system (baseline mode).
 * Uses environment variables for API keys, curated model list.
 */

// Types
export type {
  AIProvider,
  AIModel,
  AIGenerateOptions,
  AIGenerateResult,
  AIStreamChunk,
  UserAISettings,
} from './types';

export { AIProviderError, AIKeyError, AIRateLimitError, AIQuotaError } from './types';

// Registry
export {
  providers,
  CURATED_MODELS,
  getProvider,
  getProviderIds,
  getCuratedModels,
  getDefaultProviderAndModel,
  getModel,
} from './registry';

// Configuration
export { getApiKey, hasApiKey, getAvailableProviders } from './config';

// Services (main entry points)
export { aiService } from '../services/aiService';

// UI Components
export { ModelSelector } from '../components/AI/ModelSelector';
