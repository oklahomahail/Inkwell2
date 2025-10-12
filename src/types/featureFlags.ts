/**
 * Types for the feature flags system
 */

/**
 * Feature flag categories
 */
export type FeatureFlagCategory = 'core' | 'experimental' | 'debug';

/**
 * Base feature flag configuration
 */
export interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  defaultValue: boolean;
  category: FeatureFlagCategory;
  requiresReload?: boolean;
  dependencies?: string[];
}

/**
 * Feature flag configuration map
 */
export interface FeatureFlagConfig {
  [key: string]: FeatureFlag;
}

/**
 * Feature flag with state
 */
export interface FeatureFlagState extends FeatureFlag {
  enabled: boolean;
}
