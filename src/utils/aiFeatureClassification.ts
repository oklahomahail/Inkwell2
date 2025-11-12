/**
 * AI Feature Classification Utility
 *
 * Helps identify which planning features require API keys vs. work with free AI
 */

import { requiresApiKey } from '@/ai/registry';
import type { AiSettings } from '@/types/ai';

export type AiFeatureMode = 'free' | 'apiKey' | 'premium';

export interface AiFeatureConfig {
  title: string;
  description: string;
  mode: AiFeatureMode;
  actionLabel: string;
  route?: string;
  onClick?: () => void;
}

/**
 * Check if user has configured a valid API key
 * Checks both the simple mode (AiSettingsContext) and localStorage fallbacks
 */
export function hasUserApiKey(settings: AiSettings): boolean {
  // Check if using custom mode with an API key
  if (settings.mode === 'custom' && settings.customApiKey) {
    return true;
  }

  // Check legacy storage (inkwell_user_api_keys)
  try {
    const userKeys = localStorage.getItem('inkwell_user_api_keys');
    if (userKeys) {
      const keys = JSON.parse(userKeys);
      // Check if any provider has a key
      return !!(keys?.openai || keys?.anthropic || keys?.google);
    }
  } catch {
    // Ignore parse errors
  }

  return false;
}

/**
 * Check if a specific feature requires an API key based on current settings
 */
export function featureRequiresKey(mode: AiFeatureMode, settings: AiSettings): boolean {
  if (mode === 'free') return false;
  if (mode === 'premium') return false; // Premium features checked separately

  // If feature requires key, check if the current provider/model needs one
  return requiresApiKey(settings.provider, settings.model);
}

/**
 * Check if a feature is available (either free or has required API key)
 */
export function isFeatureAvailable(
  mode: AiFeatureMode,
  settings: AiSettings,
  isPremiumUser = false,
): boolean {
  if (mode === 'free') return true;
  if (mode === 'premium') return isPremiumUser; // Future: check subscription status
  return hasUserApiKey(settings);
}

/**
 * Get the appropriate badge status for a feature
 */
export type BadgeStatus = 'free' | 'connected' | 'locked' | 'premium';

export function getFeatureBadgeStatus(
  mode: AiFeatureMode,
  settings: AiSettings,
  isPremiumUser = false,
): BadgeStatus {
  if (mode === 'free') return 'free';
  if (mode === 'premium') return isPremiumUser ? 'connected' : 'premium';
  return hasUserApiKey(settings) ? 'connected' : 'locked';
}
