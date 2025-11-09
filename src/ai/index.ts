/**
 * AI Provider System
 *
 * Exports for the multi-provider AI system.
 * Baseline Mode: Curated models with environment variables
 * Advanced Mode: Extended models with user API key overrides
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
  EXTENDED_MODELS,
  getProvider,
  getProviderIds,
  getCuratedModels,
  getModels,
  getDefaultProviderAndModel,
  getModel,
} from './registry';

// Configuration
export {
  getApiKey,
  hasApiKey,
  getAvailableProviders,
  setUserApiKey,
  removeUserApiKey,
} from './config';

// State
export { useAiPreferences } from '../state/ai/aiPreferences';

// Services (main entry points)
export { aiService } from '../services/aiService';

// UI Components
export { ModelSelector } from '../components/AI/ModelSelector';
export { AdvancedModeToggle } from '../components/AI/AdvancedModeToggle';
export { AiProviderKeys } from '../components/Settings/AiProviderKeys';
