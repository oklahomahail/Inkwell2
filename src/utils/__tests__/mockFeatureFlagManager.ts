import { FeatureFlagCategory, FeatureFlagConfig, FeatureFlagState } from '../../types/featureFlags';

// Constants - this is the source of truth for test data
export const FEATURE_FLAGS: FeatureFlagConfig = {
  plotBoards: {
    key: 'plotBoards',
    name: 'Plot Boards',
    description: 'Test feature',
    defaultValue: false,
    category: 'experimental',
  },
  exportWizard: {
    key: 'exportWizard',
    name: 'Export Wizard',
    description: 'Test feature',
    defaultValue: true,
    category: 'core',
  },
  advancedExport: {
    key: 'advancedExport',
    name: 'Advanced Export',
    description: 'Test feature',
    defaultValue: false,
    category: 'experimental',
    dependencies: ['exportWizard'],
  },
  debugState: {
    key: 'debugState',
    name: 'Debug State',
    description: 'Test feature',
    defaultValue: false,
    category: 'debug',
  },
};

// Feature flags map used by the mock implementation
let FLAGS = { ...FEATURE_FLAGS };

export class MockFeatureFlagManager {
  private static instance: MockFeatureFlagManager | null = null;
  private cache = new Map<string, boolean>();
  private urlParams: URLSearchParams;

  constructor() {
    this.urlParams = new URLSearchParams(window.location.search);
    this.cache = new Map<string, boolean>();
    this.readInitialState();
  }

  static getInstance(): MockFeatureFlagManager {
    if (!MockFeatureFlagManager.instance) {
      MockFeatureFlagManager.instance = new MockFeatureFlagManager();
    }
    return MockFeatureFlagManager.instance;
  }

  static resetInstance(): void {
    MockFeatureFlagManager.instance = null;
  }

  private readInitialState(): void {
    this.cache.clear();

    // Reset all cache and storage on initialization
    localStorage.clear();
    this.cache.clear();

    // Initialize with storage values
    Object.entries(FEATURE_FLAGS).forEach(([key, flag]) => {
      const storageKey = `inkwell_flag_${key}`;
      const storageValue = localStorage.getItem(storageKey);
      // Do not set defaults in storage, keep in cache only
      this.cache.set(key, storageValue === 'true' || flag.defaultValue);
    });

    // Apply URL overrides
    this.initializeFromURL();
  }

  private initializeFromURL(): void {
    if (this.urlParams.get('trace') === '1') {
      Object.values(FLAGS)
        .filter((flag) => flag.category === 'debug')
        .forEach((flag) => this.setEnabled(flag.key, true));
    }

    Object.values(FLAGS).forEach((flag) => {
      const urlValue = this.urlParams.get(flag.key);
      if (urlValue !== null) {
        this.setEnabled(flag.key, urlValue === '1' || urlValue === 'true');
      }
    });
  }

  isEnabled(flagKey: string): boolean {
    const flag = FEATURE_FLAGS[flagKey];
    if (!flag) {
      console.warn(`Unknown feature flag: ${flagKey}`);
      return false;
    }

    // First check if we should check dependencies
    const shouldCheckDependencies = !!flag.dependencies?.length;

    // Get current enabled state
    const storageKey = `inkwell_flag_${flagKey}`;
    const storedValue = localStorage.getItem(storageKey);
    const isEnabled = storedValue === null ? flag.defaultValue : storedValue === 'true';

    // Update cache
    this.cache.set(flagKey, isEnabled);

    // If this flag is enabled and has dependencies, check them
    if (shouldCheckDependencies && isEnabled) {
      const allDepsEnabled = flag.dependencies!.every((dep) => {
        const depFlag = FEATURE_FLAGS[dep];
        if (!depFlag) return false;
        const depStorageKey = `inkwell_flag_${dep}`;
        const depStoredValue = localStorage.getItem(depStorageKey);
        // Consider dependency satisfied only if explicitly enabled in storage
        return depStoredValue === 'true';
      });
      return allDepsEnabled;
    }

    return isEnabled;
  }

  setEnabled(flagKey: string, enabled: boolean): void {
    const flag = FEATURE_FLAGS[flagKey];
    if (!flag) {
      console.warn(`Unknown feature flag: ${flagKey}`);
      return;
    }

    const storageKey = `inkwell_flag_${flagKey}`;
    // Update localStorage
    localStorage.setItem(storageKey, enabled.toString());

    // Update cache
    this.cache.set(flagKey, enabled);

    // Dispatch storage event for React components
    const newValue = this.isEnabled(flagKey).toString();
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: storageKey,
        newValue,
      }),
    );

    if (flag.requiresReload) {
      console.log(`⚠️ Feature ${flag.name} requires page reload to take effect`);
    }
  }

  reset(flagKey: string): void {
    const flag = FEATURE_FLAGS[flagKey];
    if (!flag) {
      console.warn(`Unknown feature flag: ${flagKey}`);
      return;
    }

    const storageKey = `inkwell_flag_${flagKey}`;
    localStorage.setItem(storageKey, flag.defaultValue.toString());
    this.cache.set(flagKey, flag.defaultValue);

    // Dispatch storage event for React components
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: storageKey,
        newValue: flag.defaultValue.toString(),
      }),
    );
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
    const modifiedFlags = this.getAllFlags().filter(
      (flag) => this.isEnabled(flag.key) !== flag.defaultValue,
    );

    Object.values(FLAGS).forEach((flag) => {
      url.searchParams.delete(flag.key);
    });

    modifiedFlags.forEach((flag) => {
      url.searchParams.set(flag.key, this.isEnabled(flag.key) ? '1' : '0');
    });

    return url.toString();
  }
}
