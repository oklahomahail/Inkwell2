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
} as const;

// Simple feature check function 
export function isFeatureEnabled(feature: keyof typeof FEATURES): boolean {
  return FEATURES[feature];
}

// Legacy compatibility for existing useFeatureFlag calls
export function useFeatureFlag(feature: keyof typeof FEATURES): boolean {
  return FEATURES[feature];
}

// Simple feature check for backwards compatibility
export function isEnabled(feature: keyof typeof FEATURES): boolean {
  return FEATURES[feature];
}