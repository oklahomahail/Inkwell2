import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest';

// Ensure the FeatureFlagManager module is mocked before importing it
vi.mock('../FeatureFlagManager', () => ({
  FeatureFlagManager: MockFeatureFlagManager,
}));

import { FeatureFlagManager } from '../FeatureFlagManager';

import { MockFeatureFlagManager, FEATURE_FLAGS } from './mockFeatureFlagManager';

// Mock localStorage
const mockLocalStorage = {
  store: {} as Record<string, string>,
  getItem(key: string) {
    return this.store[key] ?? null;
  },
  setItem(key: string, value: string) {
    this.store[key] = value;
  },
  removeItem(key: string) {
    delete this.store[key];
  },
  clear() {
    this.store = {};
  },
};

// Place beforeEach at top level
beforeEach(() => {
  // Reset localStorage
  mockLocalStorage.clear();

  // Reset singleton
  (FeatureFlagManager as any).instance = null;

  // Mock storage
  Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
  });

  // Mock location for URL-based features
  Object.defineProperty(window, 'location', {
    value: new URL('http://localhost:3000'),
  });
});

describe('FeatureFlagManager', () => {
  let manager: FeatureFlagManager;

  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();

    // Reset the singleton instance
    (FeatureFlagManager as any).instance = null;

    // Create a new instance
    manager = FeatureFlagManager.getInstance();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('basic functionality', () => {
    it('returns false for unknown flags', () => {
      expect(manager.isEnabled('unknown_flag')).toBe(false);
    });

    it('returns default value for new flags', () => {
      expect(manager.isEnabled('plotBoards')).toBe(false);
      expect(manager.isEnabled('exportWizard')).toBe(true);
    });

    it('persists flag values to localStorage', () => {
      manager.setEnabled('plotBoards', true);
      expect(localStorage.getItem('inkwell_flag_plotBoards')).toBe('true');

      const newManager = FeatureFlagManager.getInstance();
      expect(newManager.isEnabled('plotBoards')).toBe(true);
    });
  });

  describe('dependencies', () => {
    it('respects flag dependencies', () => {
      // Advanced export depends on export wizard
      manager.setEnabled('advancedExport', true);
      expect(manager.isEnabled('advancedExport')).toBe(false);

      manager.setEnabled('exportWizard', true);
      expect(manager.isEnabled('advancedExport')).toBe(true);
    });

    it('handles multiple dependencies correctly', () => {
      const flag = {
        key: 'testFlag',
        name: 'Test Flag',
        description: 'Test flag with dependencies',
        defaultValue: false,
        category: 'experimental' as const,
        dependencies: ['plotBoards', 'exportWizard'],
      };

      // Add test flag
      (FEATURE_FLAGS as any).testFlag = flag;

      manager.setEnabled('testFlag', true);
      expect(manager.isEnabled('testFlag')).toBe(false);

      manager.setEnabled('plotBoards', true);
      expect(manager.isEnabled('testFlag')).toBe(false);

      manager.setEnabled('exportWizard', true);
      expect(manager.isEnabled('testFlag')).toBe(true);
    });
  });

  describe('categories', () => {
    it('correctly filters flags by category', () => {
      const coreFlags = manager.getFlagsByCategory('core');
      const experimentalFlags = manager.getFlagsByCategory('experimental');
      const debugFlags = manager.getFlagsByCategory('debug');

      expect(coreFlags.every((f) => f.category === 'core')).toBe(true);
      expect(experimentalFlags.every((f) => f.category === 'experimental')).toBe(true);
      expect(debugFlags.every((f) => f.category === 'debug')).toBe(true);
    });
  });

  describe('debug mode', () => {
    it('enables all debug flags in debug mode', () => {
      manager.enableDebugMode();
      const debugFlags = manager.getFlagsByCategory('debug');
      expect(debugFlags.every((f) => f.enabled)).toBe(true);
    });

    it('disables debug flags when exiting debug mode', () => {
      manager.enableDebugMode();
      manager.disableDebugMode();
      const debugFlags = manager.getFlagsByCategory('debug');
      expect(debugFlags.every((f) => !f.enabled)).toBe(true);
    });
  });

  describe('URL handling', () => {
    it('correctly generates URL with modified flags', () => {
      // Enable some flags
      manager.setEnabled('plotBoards', true);
      manager.setEnabled('exportWizard', false);

      const url = manager.exportAsURL();
      expect(url).toContain('plotBoards=1');
      expect(url).toContain('exportWizard=0');
    });
  });

  describe('reset functionality', () => {
    it('resets individual flags', () => {
      manager.setEnabled('plotBoards', true);
      manager.reset('plotBoards');
      expect(manager.isEnabled('plotBoards')).toBe(false);
    });

    it('resets all flags', () => {
      // Enable several flags
      manager.setEnabled('plotBoards', true);
      manager.setEnabled('exportWizard', false);
      manager.enableDebugMode();

      // Reset all flags
      manager.resetAll();

      // Verify they're back to defaults
      expect(manager.isEnabled('plotBoards')).toBe(false);
      expect(manager.isEnabled('exportWizard')).toBe(true);
      expect(manager.isEnabled('debugState')).toBe(false);
    });
  });
});
