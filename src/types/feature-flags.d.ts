// Feature flags type declarations
export type FeatureFlagCategory = 'core' | 'experimental' | 'debug';

export interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  defaultValue: boolean;
  category: FeatureFlagCategory;
  requiresReload?: boolean;
}

export interface FeatureFlagConfig {
  // Core features
  EXPORT_WIZARD: FeatureFlag;
  AI_PLOT_ANALYSIS: FeatureFlag;
  INSIGHTS_TAB: FeatureFlag;
  TIMELINE_CONSISTENCY: FeatureFlag;
  CHARACTER_CONSISTENCY: FeatureFlag;
  DISTRACTION_FREE_MODE: FeatureFlag;

  // Experimental features
  PLOT_BOARDS: FeatureFlag;
  ADVANCED_EXPORT: FeatureFlag;
  ADVANCED_TEXT_ANALYSIS: FeatureFlag;
  COLLABORATION: FeatureFlag;
  COLLABORATION_UI: FeatureFlag;

  // Debug features
  DEBUG_STORAGE: FeatureFlag;
  DEBUG_STATE: FeatureFlag;
  PERFORMANCE_MONITORING: FeatureFlag;
}

export interface FeatureFlagStore {
  isEnabled(flagKey: string): boolean;
  setEnabled(flagKey: string, enabled: boolean): void;
  reset(flagKey: string): void;
  getAllFlags(): Array<FeatureFlag & { enabled: boolean }>;
  getFlagsByCategory(category: FeatureFlagCategory): Array<FeatureFlag & { enabled: boolean }>;
  exportAsURL(): string;
  isDebugMode(): boolean;
  enableDebugMode(): void;
  disableDebugMode(): void;
}
