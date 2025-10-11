// Test file for feature flag system
import { render, screen, act } from '@testing-library/react';
import { vi } from 'vitest';
import '@testing-library/jest-dom';

import { featureFlags, useFeatureFlag, withFeatureFlag, FEATURE_FLAGS } from './flags';

// Mock localStorage
const mockStorage = {
  store: {} as Record<string, string>,
  getItem: vi.fn((key: string) => mockStorage.store[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    mockStorage.store[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete mockStorage.store[key];
  }),
  clear: vi.fn(() => {
    mockStorage.store = {};
  }),
  length: 0,
  key: vi.fn((index: number) => Object.keys(mockStorage.store)[index] || null),
};

// Test Suite
describe('Enhanced Feature Flags System', () => {
  beforeEach(() => {
    // Reset URL params
    Object.defineProperty(window, 'location', {
      value: { ...window.location, search: '' },
      writable: true,
    });

    // Setup localStorage mock BEFORE resetting flags
    Object.defineProperty(window, 'localStorage', { value: mockStorage });

    // Clear localStorage and reset flags before each test
    mockStorage.clear();
    // Use the testing reset to ensure cache and URL params are re-read
    (featureFlags as any).constructor['__testing__'].resetAll();
  });

  afterEach(() => {
    // Clean up after each test
    mockStorage.clear();

    // Reset mock calls
    mockStorage.getItem.mockClear();
    mockStorage.setItem.mockClear();
    mockStorage.removeItem.mockClear();
    mockStorage.clear.mockClear();
  });

  describe('New Feature Flags', () => {
    it('should have Export Wizard flag', () => {
      expect(FEATURE_FLAGS.EXPORT_WIZARD.key).toBe('exportWizard');
      expect(FEATURE_FLAGS.EXPORT_WIZARD.name).toBe('Export Wizard');
      expect(FEATURE_FLAGS.EXPORT_WIZARD.defaultValue).toBe(true);
      expect(FEATURE_FLAGS.EXPORT_WIZARD.category).toBe('core');
    });

    it('should have AI Plot Analysis flag', () => {
      expect(FEATURE_FLAGS.AI_PLOT_ANALYSIS.key).toBe('aiPlotAnalysis');
      expect(FEATURE_FLAGS.AI_PLOT_ANALYSIS.name).toBe('AI Plot Analysis');
      expect(FEATURE_FLAGS.AI_PLOT_ANALYSIS.defaultValue).toBe(true);
      expect(FEATURE_FLAGS.AI_PLOT_ANALYSIS.category).toBe('core');
    });

    it('should have Insights Tab flag', () => {
      expect(FEATURE_FLAGS.INSIGHTS_TAB.key).toBe('insightsTab');
      expect(FEATURE_FLAGS.INSIGHTS_TAB.name).toBe('Project Insights Tab');
      expect(FEATURE_FLAGS.INSIGHTS_TAB.defaultValue).toBe(true);
      expect(FEATURE_FLAGS.INSIGHTS_TAB.category).toBe('core');
    });

    it('should have Enhanced Collaboration UI flag', () => {
      expect(FEATURE_FLAGS.COLLABORATION_UI.key).toBe('collaborationUI');
      expect(FEATURE_FLAGS.COLLABORATION_UI.name).toBe('Enhanced Collaboration UI');
      expect(FEATURE_FLAGS.COLLABORATION_UI.defaultValue).toBe(false);
      expect(FEATURE_FLAGS.COLLABORATION_UI.category).toBe('experimental');
      expect(FEATURE_FLAGS.COLLABORATION_UI.requiresReload).toBe(true);
    });
  });

  describe('Feature Flag Manager', () => {
    it('should return correct default values for new flags', () => {
      expect(featureFlags.isEnabled('exportWizard')).toBe(true);
      expect(featureFlags.isEnabled('aiPlotAnalysis')).toBe(true);
      expect(featureFlags.isEnabled('insightsTab')).toBe(true);
      expect(featureFlags.isEnabled('collaborationUI')).toBe(false);
    });

    it('should allow setting flag values and persist them', () => {
      featureFlags.setEnabled('exportWizard', false);
      expect(featureFlags.isEnabled('exportWizard')).toBe(false);
      expect(localStorage.getItem('inkwell_flag_exportWizard')).toBe('false');

      featureFlags.setEnabled('collaborationUI', true);
      expect(featureFlags.isEnabled('collaborationUI')).toBe(true);
      expect(localStorage.getItem('inkwell_flag_collaborationUI')).toBe('true');
    });

    it('should reset flags to defaults', () => {
      featureFlags.setEnabled('exportWizard', false);
      featureFlags.setEnabled('collaborationUI', true);

      featureFlags.reset('exportWizard');
      expect(featureFlags.isEnabled('exportWizard')).toBe(true); // Default
      expect(localStorage.getItem('inkwell_flag_exportWizard')).toBeNull();

      expect(featureFlags.isEnabled('collaborationUI')).toBe(true);
    });

    it('should categorize flags correctly', () => {
      const coreFlags = featureFlags.getFlagsByCategory('core');
      const experimentalFlags = featureFlags.getFlagsByCategory('experimental');
      const debugFlags = featureFlags.getFlagsByCategory('debug');

      const coreKeys = coreFlags.map((f) => f.key);
      expect(coreKeys).toContain('exportWizard');
      expect(coreKeys).toContain('aiPlotAnalysis');
      expect(coreKeys).toContain('insightsTab');

      const experimentalKeys = experimentalFlags.map((f) => f.key);
      expect(experimentalKeys).toContain('collaborationUI');

      const debugKeys = debugFlags.map((f) => f.key);
      expect(debugKeys).toContain('debugStorage');
      expect(debugKeys).toContain('debugState');
    });

    it('should handle URL parameters correctly', () => {
      window.location.search = '?exportWizard=0&collaborationUI=1';

      featureFlags.resetAll(); // Re-read URL params

      expect(featureFlags.isEnabled('exportWizard')).toBe(false);
      expect(featureFlags.isEnabled('collaborationUI')).toBe(true);
    });

    it('should export modified flags as URL parameters', () => {
      featureFlags.setEnabled('exportWizard', false);
      featureFlags.setEnabled('collaborationUI', true);

      const url = featureFlags.exportAsURL();
      expect(url).toContain('exportWizard=0');
      expect(url).toContain('collaborationUI=1');
    });
  });

  describe('useFeatureFlag Hook', () => {
    function TestComponent({ flagKey }: { flagKey: string }) {
      const enabled = useFeatureFlag(flagKey);
      return <div data-testid="flag-value">{enabled ? 'true' : 'false'}</div>;
    }

    it('should update when flags change', async () => {
      const { rerender } = render(<TestComponent flagKey="exportWizard" />);
      expect(screen.getByTestId('flag-value')).toHaveTextContent('true');

      // Change the flag and force a remount to ensure hook re-evaluates state
      await act(async () => {
        featureFlags.setEnabled('exportWizard', false);
      });
      rerender(<TestComponent key="exportWizard-off" flagKey="exportWizard" />);
      expect(screen.getByTestId('flag-value')).toHaveTextContent('false');

      // Test another flag (default false)
      rerender(<TestComponent key="collab" flagKey="collaborationUI" />);
      expect(screen.getByTestId('flag-value')).toHaveTextContent('false');
    });
  });

  describe('withFeatureFlag Utility', () => {
    it('should return component when flag is enabled', () => {
      const TestComponent = 'TestComponent'; // Just testing the wrapping logic
      const result = withFeatureFlag('exportWizard', TestComponent);
      expect(result).toBe(TestComponent);
    });

    it('should return null when flag is disabled', () => {
      const TestComponent = () => <div>Test</div>;
      featureFlags.setEnabled('collaborationUI', false);
      const result = withFeatureFlag('collaborationUI', TestComponent);
      expect(result).toBeNull();
    });

    it('should return fallback when flag is disabled', () => {
      const TestComponent = () => <div>Test</div>;
      const FallbackComponent = () => <div>Fallback</div>;
      featureFlags.setEnabled('collaborationUI', false);
      const result = withFeatureFlag('collaborationUI', TestComponent, FallbackComponent);
      expect(result).toBe(FallbackComponent);
    });
  });

  describe('Debug Mode Features', () => {
    it('should enable debug mode correctly', () => {
      expect(featureFlags.isDebugMode()).toBe(false);

      featureFlags.enableDebugMode();
      expect(featureFlags.isDebugMode()).toBe(true);
      expect(featureFlags.isEnabled('debugStorage')).toBe(true);
      expect(featureFlags.isEnabled('debugState')).toBe(true);
    });

    it('should disable debug mode correctly', () => {
      featureFlags.enableDebugMode();
      expect(featureFlags.isDebugMode()).toBe(true);

      featureFlags.disableDebugMode();
      expect(featureFlags.isDebugMode()).toBe(false);
      expect(featureFlags.isEnabled('debugStorage')).toBe(false);
      expect(featureFlags.isEnabled('debugState')).toBe(false);
    });
  });

  describe('Unknown Flags Handling', () => {
    it('should handle unknown flags gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      expect(featureFlags.isEnabled('unknownFlag')).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Unknown feature flag: unknownFlag');

      featureFlags.setEnabled('unknownFlag', true);
      expect(consoleSpy).toHaveBeenCalledWith('Unknown feature flag: unknownFlag');

      featureFlags.reset('unknownFlag');
      expect(consoleSpy).toHaveBeenCalledWith('Unknown feature flag: unknownFlag');

      consoleSpy.mockRestore();
    });
  });

  describe('Console Commands', () => {
    it('should expose flag management functions in development', () => {
      // Console commands are only available in development mode
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        expect((window as any).__inkwellFlags).toBeDefined();
        expect(typeof (window as any).__inkwellFlags.list).toBe('function');
        expect(typeof (window as any).__inkwellFlags.enable).toBe('function');
        expect(typeof (window as any).__inkwellFlags.disable).toBe('function');
        expect(typeof (window as any).__inkwellFlags.reset).toBe('function');
        expect(typeof (window as any).__inkwellFlags.debug).toBe('function');
        expect(typeof (window as any).__inkwellFlags.export).toBe('function');
      } else {
        expect((window as any).__inkwellFlags).toBeUndefined();
      }
    });
  });
});
