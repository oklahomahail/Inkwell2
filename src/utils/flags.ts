/**
 * Feature flags entry point
 * Re-exports all feature flag functionality
 */

// Import dependencies first
import { FeatureFlagManager } from './FeatureFlagManager';

// Create singleton instance
export const featureFlags = FeatureFlagManager.getInstance();

// Re-export manager class
export { FeatureFlagManager };

// Export types from our types file
export * from '../types/featureFlags';

// Export the configuration
export { FEATURE_FLAGS } from './featureFlags.config';

// Export React integration
export {
  FeatureGate,
  useFeatureFlag,
  withFeatureFlag,
  FeatureFlagProvider,
  useFeatureFlags,
} from './featureFlags.react';

// Expose console utilities in development
if (
  typeof window !== 'undefined' &&
  (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test')
) {
  (window as any).__inkwellFlags = {
    list: () => featureFlags.getAllFlags(),
    enable: (key: string) => featureFlags.setEnabled(key, true),
    disable: (key: string) => featureFlags.setEnabled(key, false),
    reset: (key: string) => featureFlags.reset(key),
    debug: () => featureFlags.enableDebugMode(),
    export: () => featureFlags.exportAsURL(),
  };

  console.log('🚩 Feature flags available at window.__inkwellFlags');
}
