// src/services/featureFlagService.ts
import { analyticsService } from './analyticsService';

export interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  category: 'ai' | 'performance' | 'ui' | 'experimental';
  requiresConfig?: boolean;
  dependencies?: string[];
}

export interface FeatureFlagConfig {
  flags: Record<string, boolean>;
  overrides: Record<string, boolean>;
  environment: 'development' | 'production' | 'demo';
  lastUpdated: number;
}

class FeatureFlagService {
  private readonly STORAGE_KEY = 'inkwell_feature_flags';
  private config: FeatureFlagConfig;
  private listeners: Array<(flags: Record<string, boolean>) => void> = [];

  // Define all available feature flags
  private readonly DEFAULT_FLAGS: FeatureFlag[] = [
    // AI Features
    {
      key: 'ai_enabled',
      name: 'AI Assistant',
      description: 'Enable Claude AI writing assistance',
      enabled: true,
      category: 'ai',
      requiresConfig: true,
    },
    {
      key: 'ai_mock_mode',
      name: 'AI Mock Mode',
      description: 'Use mock AI responses for demos and development',
      enabled: false,
      category: 'ai',
    },
    {
      key: 'ai_enhanced_toolbar',
      name: 'Enhanced AI Toolbar',
      description: 'Advanced AI writing tools and real-time analysis',
      enabled: true,
      category: 'ai',
      dependencies: ['ai_enabled'],
    },
    {
      key: 'ai_story_architect',
      name: 'Story Architect',
      description: 'AI-powered story outline generation',
      enabled: true,
      category: 'ai',
      dependencies: ['ai_enabled'],
    },
    {
      key: 'ai_consistency_guardian',
      name: 'Consistency Guardian',
      description: 'AI-powered story consistency checking',
      enabled: true,
      category: 'ai',
      dependencies: ['ai_enabled'],
    },
    {
      key: 'ai_retry_logic',
      name: 'AI Retry Logic',
      description: 'Automatic retry with exponential backoff for AI requests',
      enabled: true,
      category: 'ai',
    },
    {
      key: 'ai_circuit_breaker',
      name: 'AI Circuit Breaker',
      description: 'Prevent cascading failures when AI service is down',
      enabled: true,
      category: 'ai',
    },

    // Performance Features
    {
      key: 'performance_monitoring',
      name: 'Performance Monitoring',
      description: 'Track rendering and scroll performance',
      enabled: process.env.NODE_ENV === 'development',
      category: 'performance',
    },
    {
      key: 'virtualized_lists',
      name: 'Virtualized Lists',
      description: 'Use virtualization for large lists',
      enabled: true,
      category: 'performance',
    },

    // UI Features
    {
      key: 'pwa_features',
      name: 'PWA Features',
      description: 'Progressive Web App capabilities',
      enabled: true,
      category: 'ui',
    },
    {
      key: 'analytics_enabled',
      name: 'Privacy-First Analytics',
      description: 'Track user interactions while respecting privacy',
      enabled: true,
      category: 'ui',
    },

    // Experimental Features
    {
      key: 'experimental_features',
      name: 'Experimental Features',
      description: 'Enable experimental and beta features',
      enabled: false,
      category: 'experimental',
    },
    {
      key: 'demo_mode',
      name: 'Demo Mode',
      description: 'Enable demo-friendly features and mock data',
      enabled: false,
      category: 'experimental',
    },
  ];

  constructor() {
    this.config = this.loadConfig();
    this.setupEnvironmentOverrides();
  }

  /**
   * Check if a feature is enabled
   */
  isEnabled(flagKey: string): boolean {
    const flag = this.getFlag(flagKey);
    if (!flag) return false;

    // Check environment overrides first
    if (this.config.overrides[flagKey] !== undefined) {
      return this.config.overrides[flagKey];
    }

    // Check saved user preferences
    if (this.config.flags[flagKey] !== undefined) {
      return this.config.flags[flagKey] && this.areDependenciesSatisfied(flag);
    }

    // Fall back to default
    return flag.enabled && this.areDependenciesSatisfied(flag);
  }

  /**
   * Enable or disable a feature flag
   */
  setEnabled(flagKey: string, enabled: boolean): void {
    const flag = this.getFlag(flagKey);
    if (!flag) {
      console.warn(`Unknown feature flag: ${flagKey}`);
      return;
    }

    this.config.flags[flagKey] = enabled;
    this.config.lastUpdated = Date.now();
    this.saveConfig();
    this.notifyListeners();

    // Track flag changes
    analyticsService.track('feature_flag_changed', {
      flag: flagKey,
      enabled,
      category: flag.category,
    });
  }

  /**
   * Get all feature flags with their current state
   */
  getAllFlags(): Array<FeatureFlag & { isEnabled: boolean; canToggle: boolean }> {
    return this.DEFAULT_FLAGS.map((flag) => ({
      ...flag,
      isEnabled: this.isEnabled(flag.key),
      canToggle: this.canToggleFlag(flag),
    }));
  }

  /**
   * Get flags by category
   */
  getFlagsByCategory(
    category: FeatureFlag['category'],
  ): Array<FeatureFlag & { isEnabled: boolean }> {
    return this.DEFAULT_FLAGS.filter((flag) => flag.category === category).map((flag) => ({
      ...flag,
      isEnabled: this.isEnabled(flag.key),
    }));
  }

  /**
   * Set environment-specific overrides
   */
  setEnvironmentOverrides(overrides: Record<string, boolean>): void {
    this.config.overrides = { ...this.config.overrides, ...overrides };
    this.config.lastUpdated = Date.now();
    this.saveConfig();
    this.notifyListeners();
  }

  /**
   * Enable demo mode - activates demo-friendly flags
   */
  enableDemoMode(): void {
    const demoOverrides = {
      ai_mock_mode: true,
      demo_mode: true,
      ai_enabled: true,
      performance_monitoring: false,
    };

    this.setEnvironmentOverrides(demoOverrides);
    console.log('🎭 Demo mode enabled with mock AI responses');

    analyticsService.track('demo_mode_enabled', {
      overrides: Object.keys(demoOverrides),
    });
  }

  /**
   * Disable demo mode
   */
  disableDemoMode(): void {
    const keysToRemove = ['ai_mock_mode', 'demo_mode'];

    keysToRemove.forEach((key) => {
      delete this.config.overrides[key];
    });

    this.config.lastUpdated = Date.now();
    this.saveConfig();
    this.notifyListeners();

    console.log('🎭 Demo mode disabled');
    analyticsService.track('demo_mode_disabled', {
      previousFlags: Object.keys(this.config.flags).filter((key) => this.config.flags[key]),
      reason: 'user_action',
    });
  }

  /**
   * Reset all flags to defaults
   */
  resetToDefaults(): void {
    this.config.flags = {};
    this.config.overrides = {};
    this.config.lastUpdated = Date.now();
    this.saveConfig();
    this.notifyListeners();

    analyticsService.track('feature_flags_reset', {
      previousFlags: Object.keys(this.config.flags).filter((key) => this.config.flags[key]),
      reason: 'user_action',
    });
  }

  /**
   * Subscribe to flag changes
   */
  subscribe(callback: (flags: Record<string, boolean>) => void): () => void {
    this.listeners.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Get current environment
   */
  getEnvironment(): FeatureFlagConfig['environment'] {
    return this.config.environment;
  }

  /**
   * Set environment (affects default flag behavior)
   */
  setEnvironment(env: FeatureFlagConfig['environment']): void {
    this.config.environment = env;
    this.config.lastUpdated = Date.now();
    this.setupEnvironmentOverrides();
    this.saveConfig();
    this.notifyListeners();
  }

  // Private methods

  private getFlag(key: string): FeatureFlag | undefined {
    return this.DEFAULT_FLAGS.find((flag) => flag.key === key);
  }

  private areDependenciesSatisfied(flag: FeatureFlag): boolean {
    if (!flag.dependencies) return true;

    return flag.dependencies.every((dep) => this.isEnabled(dep));
  }

  private canToggleFlag(flag: FeatureFlag): boolean {
    // Can't toggle if it's overridden by environment
    if (this.config.overrides[flag.key] !== undefined) return false;

    // Can't toggle if dependencies aren't satisfied
    if (flag.dependencies && !this.areDependenciesSatisfied(flag)) return false;

    return true;
  }

  private setupEnvironmentOverrides(): void {
    switch (this.config.environment) {
      case 'development':
        this.config.overrides = {
          ...this.config.overrides,
          performance_monitoring: true,
        };
        break;

      case 'demo':
        this.config.overrides = {
          ...this.config.overrides,
          ai_mock_mode: true,
          demo_mode: true,
          performance_monitoring: false,
        };
        break;

      case 'production':
        this.config.overrides = {
          ...this.config.overrides,
          performance_monitoring: false,
          experimental_features: false,
        };
        break;
    }
  }

  private loadConfig(): FeatureFlagConfig {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return this.getDefaultConfig();

      const parsed = JSON.parse(stored);
      return {
        ...this.getDefaultConfig(),
        ...parsed,
      };
    } catch (error) {
      console.warn('Failed to load feature flag config:', error);
      return this.getDefaultConfig();
    }
  }

  private saveConfig(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.config));
    } catch (error) {
      console.warn('Failed to save feature flag config:', error);
    }
  }

  private getDefaultConfig(): FeatureFlagConfig {
    const environment = process.env.NODE_ENV === 'development' ? 'development' : 'production';

    return {
      flags: {},
      overrides: {},
      environment: environment as FeatureFlagConfig['environment'],
      lastUpdated: Date.now(),
    };
  }

  private notifyListeners(): void {
    const currentFlags = this.DEFAULT_FLAGS.reduce(
      (acc, flag) => {
        acc[flag.key] = this.isEnabled(flag.key);
        return acc;
      },
      {} as Record<string, boolean>,
    );

    this.listeners.forEach((callback) => {
      try {
        callback(currentFlags);
      } catch (error) {
        console.error('Feature flag listener error:', error);
      }
    });
  }
}

export const featureFlagService = new FeatureFlagService();
export default featureFlagService;
