/**
 * AI Provider System
 *
 * Exports for the multi-provider AI system.
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
  getProvider,
  getProviderIds,
  getFreeModels,
  getPaidModels,
  getRecommendedFreeProvider,
  getModel,
  requiresApiKey,
} from './registry';

// Services (main entry points)
export { aiService } from '../services/aiService';
export { aiSettingsService } from '../services/aiSettingsService';

// UI Components
export { AiModelSettings } from '../components/Settings/AiModelSettings';
