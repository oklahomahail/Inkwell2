import devLog from "@/utils/devLog";

import { FeatureFlagCategory, FeatureFlagState } from '../types/featureFlags';

import { FEATURE_FLAGS } from './featureFlags.config';

/**
 * Manages feature flag state and operations
 */
export class FeatureFlagManager {
  private static instance: FeatureFlagManager | null = null;
  private cache = new Map<string, boolean>();
  private urlParams: URLSearchParams;

  constructor() {
    this.urlParams = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    this.cache = new Map<string, boolean>();
    this.readInitialState();
  }

  static getInstance(): FeatureFlagManager {
    if (!FeatureFlagManager.instance) {
      FeatureFlagManager.instance = new FeatureFlagManager();
    }
    return FeatureFlagManager.instance;
  }

  private readInitialState(): void {
    this.cache.clear();

    // Initialize with default values
    Object.values(FEATURE_FLAGS).forEach((flag) => {
      const storageKey = `inkwell_flag_${flag.key}`;
      const storageValue = localStorage.getItem(storageKey);

      this.cache.set(flag.key, storageValue === 'true' || flag.defaultValue);
    });

    // Apply URL overrides
    this.initializeFromURL();
  }

  private initializeFromURL(): void {
    if (this.urlParams.get('trace') === '1') {
      Object.values(FEATURE_FLAGS)
        .filter((flag) => flag.category === 'debug')
        .forEach((flag) => this.cache.set(flag.key, true));
    }

    Object.values(FEATURE_FLAGS).forEach((flag) => {
      const urlValue = this.urlParams.get(flag.key);
      if (urlValue !== null) {
        this.cache.set(flag.key, urlValue === '1' || urlValue === 'true');
      }
    });
  }

  isEnabled(flagKey: string): boolean {
    if (this.cache.has(flagKey)) {
      const enabled = this.cache.get(flagKey)!;
      const flag = FEATURE_FLAGS[flagKey];

      if (flag?.dependencies?.length) {
        return enabled && flag.dependencies.every((dep) => this.isEnabled(dep));
      }

      return enabled;
    }

    const flag = FEATURE_FLAGS[flagKey];
    if (!flag) {
      console.warn(`Unknown feature flag: ${flagKey}`);
      return false;
    }

    const enabled = flag.defaultValue;
    this.cache.set(flagKey, enabled);
    return enabled;
  }

  setEnabled(flagKey: string, enabled: boolean): void {
    const flag = FEATURE_FLAGS[flagKey];
    if (!flag) {
      console.warn(`Unknown feature flag: ${flagKey}`);
      return;
    }

    const storageKey = `inkwell_flag_${flagKey}`;
    localStorage.setItem(storageKey, enabled.toString());
    this.cache.set(flagKey, enabled);

    if (flag.requiresReload) {
      devLog.debug(`⚠️ Feature ${flag.name} requires page reload to take effect`);
    }
  }

  reset(flagKey: string): void {
    const flag = FEATURE_FLAGS[flagKey];
    if (!flag) {
      console.warn(`Unknown feature flag: ${flagKey}`);
      return;
    }

    const storageKey = `inkwell_flag_${flagKey}`;
    localStorage.removeItem(storageKey);
    this.cache.delete(flagKey);
  }

  getAllFlags(): FeatureFlagState[] {
    return Object.values(FEATURE_FLAGS).map((flag) => ({
      ...flag,
      enabled: this.isEnabled(flag.key),
    }));
  }

  getFlagsByCategory(category: FeatureFlagCategory): FeatureFlagState[] {
    return this.getAllFlags().filter((flag) => flag.category === category);
  }

  enableDebugMode(): void {
    Object.values(FEATURE_FLAGS)
      .filter((flag) => flag.category === 'debug')
      .forEach((flag) => this.setEnabled(flag.key, true));
  }

  disableDebugMode(): void {
    Object.values(FEATURE_FLAGS)
      .filter((flag) => flag.category === 'debug')
      .forEach((flag) => this.setEnabled(flag.key, false));
  }

  resetAll(): void {
    Object.values(FEATURE_FLAGS).forEach((flag) => {
      const storageKey = `inkwell_flag_${flag.key}`;
      localStorage.removeItem(storageKey);
    });
    this.readInitialState();
  }

  exportAsURL(): string {
    const url = new URL(window.location.href);
    const modifiedFlags = this.getAllFlags().filter((flag) => flag.enabled !== flag.defaultValue);

    Object.values(FEATURE_FLAGS).forEach((flag) => {
      url.searchParams.delete(flag.key);
    });

    modifiedFlags.forEach((flag) => {
      url.searchParams.set(flag.key, flag.enabled ? '1' : '0');
    });

    return url.toString();
  }
}
