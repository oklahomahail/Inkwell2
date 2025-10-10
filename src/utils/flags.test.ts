// Test file for enhanced feature flags system
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { featureFlags, FEATURE_FLAGS, useFeatureFlag, withFeatureFlag } from './flags';

describe('Enhanced Feature Flags System', () => {
  beforeEach(() => {
    // Clear localStorage and cache before each test
    localStorage.clear();
    featureFlags['cache'].clear();
  });

  afterEach(() => {
    // Clean up after each test
    localStorage.clear();
  });

  describe('New Feature Flags', () => {
    it('should have Export Wizard flag', () => {
      expect(FEATURE_FLAGS.EXPORT_WIZARD).toBeDefined();
      expect(FEATURE_FLAGS.EXPORT_WIZARD.key).toBe('exportWizard');
      expect(FEATURE_FLAGS.EXPORT_WIZARD.name).toBe('Export Wizard');
      expect(FEATURE_FLAGS.EXPORT_WIZARD.defaultValue).toBe(true);
      expect(FEATURE_FLAGS.EXPORT_WIZARD.category).toBe('core');
    });

    it('should have AI Plot Analysis flag', () => {
      expect(FEATURE_FLAGS.AI_PLOT_ANALYSIS).toBeDefined();
      expect(FEATURE_FLAGS.AI_PLOT_ANALYSIS.key).toBe('aiPlotAnalysis');
      expect(FEATURE_FLAGS.AI_PLOT_ANALYSIS.name).toBe('AI Plot Analysis');
      expect(FEATURE_FLAGS.AI_PLOT_ANALYSIS.defaultValue).toBe(true);
      expect(FEATURE_FLAGS.AI_PLOT_ANALYSIS.category).toBe('core');
    });

    it('should have Insights Tab flag', () => {
      expect(FEATURE_FLAGS.INSIGHTS_TAB).toBeDefined();
      expect(FEATURE_FLAGS.INSIGHTS_TAB.key).toBe('insightsTab');
      expect(FEATURE_FLAGS.INSIGHTS_TAB.name).toBe('Project Insights Tab');
      expect(FEATURE_FLAGS.INSIGHTS_TAB.defaultValue).toBe(true);
      expect(FEATURE_FLAGS.INSIGHTS_TAB.category).toBe('core');
    });

    it('should have Enhanced Collaboration UI flag', () => {
      expect(FEATURE_FLAGS.COLLABORATION_UI).toBeDefined();
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
      // Test setting a flag to false
      featureFlags.setEnabled('exportWizard', false);
      expect(featureFlags.isEnabled('exportWizard')).toBe(false);
      expect(localStorage.getItem('inkwell_flag_exportWizard')).toBe('false');

      // Test setting a flag to true
      featureFlags.setEnabled('collaborationUI', true);
      expect(featureFlags.isEnabled('collaborationUI')).toBe(true);
      expect(localStorage.getItem('inkwell_flag_collaborationUI')).toBe('true');
    });

    it('should reset flags to defaults', () => {
      // Set some flags to non-default values
      featureFlags.setEnabled('exportWizard', false);
      featureFlags.setEnabled('collaborationUI', true);

      // Reset specific flag
      featureFlags.reset('exportWizard');
      expect(featureFlags.isEnabled('exportWizard')).toBe(true); // Default
      expect(localStorage.getItem('inkwell_flag_exportWizard')).toBeNull();

      // Other flag should remain changed
      expect(featureFlags.isEnabled('collaborationUI')).toBe(true);
    });

    it('should categorize flags correctly', () => {
      const coreFlags = featureFlags.getFlagsByCategory('core');
      const experimentalFlags = featureFlags.getFlagsByCategory('experimental');
      const debugFlags = featureFlags.getFlagsByCategory('debug');

      // Check that our new core flags are included
      const coreKeys = coreFlags.map((f) => f.key);
      expect(coreKeys).toContain('exportWizard');
      expect(coreKeys).toContain('aiPlotAnalysis');
      expect(coreKeys).toContain('insightsTab');

      // Check that collaboration UI is experimental
      const experimentalKeys = experimentalFlags.map((f) => f.key);
      expect(experimentalKeys).toContain('collaborationUI');

      // Check debug flags exist
      const debugKeys = debugFlags.map((f) => f.key);
      expect(debugKeys).toContain('debugStorage');
      expect(debugKeys).toContain('debugState');
    });

    it('should handle URL parameters correctly', () => {
      // Mock URL with parameters
      const originalLocation = window.location;
      delete (window as any).location;
      window.location = { ...originalLocation, search: '?exportWizard=0&collaborationUI=1' } as any;

      // Create new instance to test URL initialization
      const testFlags = new (featureFlags.constructor as any)();
      expect(testFlags.isEnabled('exportWizard')).toBe(false);
      expect(testFlags.isEnabled('collaborationUI')).toBe(true);

      // Restore original location
      window.location = originalLocation;
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
    it('should return flag values correctly', () => {
      expect(useFeatureFlag('exportWizard')).toBe(true);
      expect(useFeatureFlag('collaborationUI')).toBe(false);

      // Change a flag and test again
      featureFlags.setEnabled('exportWizard', false);
      expect(useFeatureFlag('exportWizard')).toBe(false);
    });
  });

  describe('withFeatureFlag Utility', () => {
    it('should return component when flag is enabled', () => {
      const TestComponent = 'TestComponent';
      const result = withFeatureFlag('exportWizard', TestComponent);
      expect(result).toBe(TestComponent);
    });

    it('should return null when flag is disabled', () => {
      featureFlags.setEnabled('collaborationUI', false);
      const TestComponent = 'TestComponent';
      const result = withFeatureFlag('collaborationUI', TestComponent);
      expect(result).toBeNull();
    });

    it('should return fallback when flag is disabled', () => {
      featureFlags.setEnabled('collaborationUI', false);
      const TestComponent = 'TestComponent';
      const FallbackComponent = 'FallbackComponent';
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
