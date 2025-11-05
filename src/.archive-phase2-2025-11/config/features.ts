// src/config/features.ts
// Simple feature constants - no complex plumbing needed

export const FEATURES = {
  // Core Features - always enabled
  aiWritingAssistant: true,
  advancedExport: true,
  plotBoards: true,
  aiPlotAnalysis: true,

  // Performance features
  performanceMonitoring: false,

  // Timeline and consistency
  timelineConsistency: true,
  characterConsistency: true,

  // E2EE Sync (Beta)
  e2eeSync:
    import.meta.env.VITE_ENABLE_E2EE_SYNC === 'true' || import.meta.env.MODE === 'development',
  backgroundSync: import.meta.env.VITE_ENABLE_BACKGROUND_SYNC === 'true',
} as const;

// Simple feature check function
export function _isFeatureEnabled(feature: keyof typeof FEATURES): boolean {
  return FEATURES[feature];
}

// Legacy compatibility for existing useFeatureFlag calls
export function _useFeatureFlag(feature: keyof typeof FEATURES): boolean {
  return FEATURES[feature];
}

// Simple feature check for backwards compatibility
export function _isEnabled(feature: keyof typeof FEATURES): boolean {
  return FEATURES[feature];
}
