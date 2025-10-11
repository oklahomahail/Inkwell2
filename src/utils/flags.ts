// Feature flags system for Inkwell
// Enables toggling features via URL params and localStorage

import React from 'react';

import { FeatureFlag, FeatureFlagConfig } from '@/types';

/* ========= Types ========= */

/* ========= Feature Flag Definitions ========= */
export const FEATURE_FLAGS: FeatureFlagConfig = {
  // Plot Boards - new feature being developed
  PLOT_BOARDS: {
    key: 'plotBoards',
    name: 'Plot Boards',
    description: 'Kanban-style plot and scene organization boards',
    defaultValue: false,
    category: 'experimental',
    requiresReload: true,
  },

  // Export Wizard - 3-step export process
  EXPORT_WIZARD: {
    key: 'exportWizard',
    name: 'Export Wizard',
    description: '3-step export wizard (format → style → review)',
    defaultValue: true,
    category: 'core',
  },

  // Advanced exports
  ADVANCED_EXPORT: {
    key: 'advancedExport',
    name: 'Advanced Export Options',
    description: 'PDF generation and advanced formatting options',
    defaultValue: false,
    category: 'experimental',
  },

  // AI Plot Analysis - intelligent story analysis
  AI_PLOT_ANALYSIS: {
    key: 'aiPlotAnalysis',
    name: 'AI Plot Analysis',
    description: 'AI-powered plot analysis with pacing, conflicts, and character insights',
    defaultValue: true,
    category: 'core',
  },

  // AI-powered features
  AI_WRITING_ASSISTANT: {
    key: 'aiWritingAssistant',
    name: 'AI Writing Assistant',
    description: 'Enhanced AI-powered writing suggestions and analysis',
    defaultValue: true,
    category: 'core',
  },

  // Performance monitoring
  PERFORMANCE_MONITORING: {
    key: 'performanceMonitoring',
    name: 'Performance Monitoring',
    description: 'Track app performance metrics and render times',
    defaultValue: false,
    category: 'debug',
  },

  // Timeline consistency checks
  TIMELINE_CONSISTENCY: {
    key: 'timelineConsistency',
    name: 'Timeline Consistency Checks',
    description: 'Automatic detection of timeline conflicts and plot holes',
    defaultValue: true,
    category: 'core',
  },

  // Character consistency tracking
  CHARACTER_CONSISTENCY: {
    key: 'characterConsistency',
    name: 'Character Consistency Tracking',
    description: 'Monitor character trait consistency across scenes',
    defaultValue: true,
    category: 'core',
  },

  // Advanced text analysis
  ADVANCED_TEXT_ANALYSIS: {
    key: 'advancedTextAnalysis',
    name: 'Advanced Text Analysis',
    description: 'Sentiment analysis, reading level, and style metrics',
    defaultValue: false,
    category: 'experimental',
  },

  // Project Insights Tab - analytics and metrics
  INSIGHTS_TAB: {
    key: 'insightsTab',
    name: 'Project Insights Tab',
    description: 'Analytics dashboard with writing metrics, progress tracking, and insights',
    defaultValue: true,
    category: 'core',
  },

  // Real-time collaboration (future feature)
  COLLABORATION: {
    key: 'collaboration',
    name: 'Real-time Collaboration',
    description: 'Share projects and collaborate with other writers',
    defaultValue: false,
    category: 'experimental',
    requiresReload: true,
  },

  // Enhanced Collaboration UI
  COLLABORATION_UI: {
    key: 'collaborationUI',
    name: 'Enhanced Collaboration UI',
    description:
      'Advanced collaboration interface with presence, comments, and conflict resolution',
    defaultValue: false,
    category: 'experimental',
    requiresReload: true,
  },

  // Distraction-free mode
  DISTRACTION_FREE_MODE: {
    key: 'distractionFreeMode',
    name: 'Distraction-Free Writing Mode',
    description: 'Hide all UI elements except the editor',
    defaultValue: false,
    category: 'core',
  },

  // Debug features
  DEBUG_STORAGE: {
    key: 'debugStorage',
    name: 'Storage Debug Info',
    description: 'Show detailed storage operation logs',
    defaultValue: false,
    category: 'debug',
  },

  DEBUG_STATE: {
    key: 'debugState',
    name: 'State Debug Panel',
    description: 'Show current app state in debug panel',
    defaultValue: false,
    category: 'debug',
  },
};

/* ========= Feature Flag Manager ========= */
class FeatureFlagManager {
  private static instance: FeatureFlagManager | null = null;

  static getInstance(): FeatureFlagManager {
    if (!FeatureFlagManager.instance) {
      FeatureFlagManager.instance = new FeatureFlagManager();
    }
    return FeatureFlagManager.instance;
  }

  static resetInstance(): void {
    FeatureFlagManager.instance = null;
  }
  private cache = new Map<string, boolean>();
  private urlParams: URLSearchParams;

  private readInitialState() {
    // Clear existing state
    this.cache.clear();

    // Initialize with default values first
    Object.values(FEATURE_FLAGS).forEach((flag) => {
      const storageKey = `inkwell_flag_${flag.key}`;
      const storageValue = localStorage.getItem(storageKey);

      if (storageValue !== null) {
        this.cache.set(flag.key, storageValue === 'true');
      } else {
        this.cache.set(flag.key, flag.defaultValue);
      }
    });

    // Then apply URL overrides
    this.urlParams = new URLSearchParams(window.location.search);
    this.initializeFromURL();
  }

  constructor() {
    this.urlParams = new URLSearchParams('');
    this.cache = new Map<string, boolean>();
    this.readInitialState();
  }

  /**
   * Initialize flags from URL parameters
   */
  private initializeFromURL(): void {
    // Check for trace parameter (enables all debug flags)
    if (this.urlParams.get('trace') === '1') {
      Object.values(FEATURE_FLAGS)
        .filter((flag) => flag.category === 'debug')
        .forEach((flag) => {
          this.cache.set(flag.key, true);
        });
      console.log('🔍 Trace mode enabled - all debug flags activated');
    }

    // Check for individual flag parameters
    Object.values(FEATURE_FLAGS).forEach((flag) => {
      const urlValue = this.urlParams.get(flag.key);
      if (urlValue !== null) {
        const enabled = urlValue === '1' || urlValue === 'true';
        this.cache.set(flag.key, enabled);
        console.log(`🚩 Flag ${flag.key} set to ${enabled} via URL`);
      }
    });
  }

  /**
   * Check if a feature flag is enabled
   */
  isEnabled(flagKey: string): boolean {
    // Check cache first
    if (this.cache.has(flagKey)) {
      return this.cache.get(flagKey)!;
    }

    const flag = Object.values(FEATURE_FLAGS).find((f) => f.key === flagKey);
    if (!flag) {
      console.warn(`Unknown feature flag: ${flagKey}`);
      return false;
    }

    // Check localStorage override
    const storageKey = `inkwell_flag_${flagKey}`;
    const storageValue = localStorage.getItem(storageKey);
    if (storageValue !== null) {
      const enabled = storageValue === 'true';
      this.cache.set(flagKey, enabled);
      return enabled;
    }

    // Use default value
    const enabled = flag.defaultValue;
    this.cache.set(flagKey, enabled);
    return enabled;
  }

  /**
   * Set a feature flag value (persists to localStorage)
   */
  setEnabled(flagKey: string, enabled: boolean): void {
    const flag = Object.values(FEATURE_FLAGS).find((f) => f.key === flagKey);
    if (!flag) {
      console.warn(`Unknown feature flag: ${flagKey}`);
      return;
    }

    const storageKey = `inkwell_flag_${flagKey}`;
    localStorage.setItem(storageKey, enabled.toString());
    this.cache.set(flagKey, enabled);

    console.log(`🚩 Flag ${flagKey} set to ${enabled}`);

    // Show reload warning if needed
    if (flag.requiresReload) {
      console.log(`⚠️ Feature ${flag.name} requires page reload to take effect`);
    }
  }

  /**
   * Reset a flag to its default value
   */
  reset(flagKey: string): void {
    const flag = Object.values(FEATURE_FLAGS).find((f) => f.key === flagKey);
    if (!flag) {
      console.warn(`Unknown feature flag: ${flagKey}`);
      return;
    }

    const storageKey = `inkwell_flag_${flagKey}`;
    localStorage.removeItem(storageKey);
    this.cache.delete(flagKey);

    console.log(`🚩 Flag ${flagKey} reset to default (${flag.defaultValue})`);
  }

  /**
   * Get all flags with their current values
   */
  getAllFlags(): Array<FeatureFlag & { enabled: boolean }> {
    return Object.values(FEATURE_FLAGS).map((flag) => ({
      ...flag,
      enabled: this.isEnabled(flag.key),
    }));
  }

  /**
   * Get flags by category
   */
  getFlagsByCategory(category: FeatureFlag['category']): Array<FeatureFlag & { enabled: boolean }> {
    return this.getAllFlags().filter((flag) => flag.category === category);
  }

  /**
   * Export current flag configuration as URL parameters
   */
  exportAsURL(): string {
    const url = new URL(window.location.href);
    const modifiedFlags = this.getAllFlags().filter((flag) => flag.enabled !== flag.defaultValue);

    // Clear existing flag parameters
    Object.values(FEATURE_FLAGS).forEach((flag) => {
      url.searchParams.delete(flag.key);
    });

    // Add modified flags
    modifiedFlags.forEach((flag) => {
      url.searchParams.set(flag.key, flag.enabled ? '1' : '0');
    });

    return url.toString();
  }

  /**
   * Check if debug mode is enabled (any debug flag active)
   */
  isDebugMode(): boolean {
    return this.getFlagsByCategory('debug').some((flag) => flag.enabled);
  }

  /**
   * Enable all debug flags (for development)
   */
  enableDebugMode(): void {
    Object.values(FEATURE_FLAGS)
      .filter((flag) => flag.category === 'debug')
      .forEach((flag) => {
        this.setEnabled(flag.key, true);
      });

    console.log('🐛 Debug mode enabled - all debug flags activated');
  }

  /**
   * Disable all debug flags
   */
  disableDebugMode(): void {
    Object.values(FEATURE_FLAGS)
      .filter((flag) => flag.category === 'debug')
      .forEach((flag) => {
        this.setEnabled(flag.key, false);
      });

    console.log('🐛 Debug mode disabled');
  }

  /**
   * Reset all flags to their initial state
   * Useful for testing and debugging
   */
  resetAll(): void {
    // Clear localStorage for all known flags
    Object.values(FEATURE_FLAGS).forEach((flag) => {
      const storageKey = `inkwell_flag_${flag.key}`;
      localStorage.removeItem(storageKey);
    });

    // Re-read initial state
    this.readInitialState();
  }

  // Test utilities
  static ['__testing__'] = {
    resetAll: () => {
      const instance = FeatureFlagManager.getInstance();
      instance.resetAll();
    },
  };
}

/* ========= Exports ========= */
export const featureFlags = FeatureFlagManager.getInstance();

// Direct flag check function
export const isEnabled = (flagKey: string): boolean => featureFlags.isEnabled(flagKey);

/* ========= React Hook ========= */
export const useFeatureFlag = _useFeatureFlag;

export function _useFeatureFlag(flagKey: string): boolean {
  const [enabled, setEnabled] = React.useState(() => featureFlags.isEnabled(flagKey));

  React.useEffect(() => {
    // Listen for storage events that might change the flag
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `inkwell_flag_${flagKey}`) {
        setEnabled(featureFlags.isEnabled(flagKey));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [flagKey]);

  return enabled;
}

/* ========= Utility Functions ========= */

/**
 * Conditional rendering based on feature flag
 */
export function withFeatureFlag<T>(flagKey: string, component: T, fallback?: T): T | null {
  return featureFlags.isEnabled(flagKey) ? component : fallback || null;
}

/**
 * Create a feature-flagged component
 */
export function createFeatureFlaggedComponent<P extends Record<string, any>>(
  flagKey: string,
  Component: React.ComponentType<P>,
  FallbackComponent?: React.ComponentType<P>,
): React.ComponentType<P> {
  return function _FeatureFlaggedComponent(props: P) {
    if (featureFlags.isEnabled(flagKey)) {
      return React.createElement(Component, props as any);
    }

    if (FallbackComponent) {
      return React.createElement(FallbackComponent, props as any);
    }

    return null;
  };
}

/* ========= Higher Order Component with ForwardRef ========= */
export function withFlag<P extends Record<string, any>>(
  Wrapped: React.ComponentType<P>,
): React.ComponentType<P> {
  const WithFlag = (props: P) => {
    // Flag logic could go here
    return React.createElement(Wrapped, props);
  };

  WithFlag.displayName = `WithFlag(${Wrapped.displayName || Wrapped.name || 'Component'})`;
  return WithFlag;
}

/* ========= Console Commands (Development) ========= */
if (
  typeof window !== 'undefined' &&
  (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test')
) {
  // Add global flag management functions for console access
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
