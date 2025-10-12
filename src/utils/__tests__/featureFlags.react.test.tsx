import { render, screen, act } from '@testing-library/react';
import React from 'react';
import { vi, beforeEach } from 'vitest';

import { FeatureFlagManager } from '../FeatureFlagManager';
import { FeatureGate, useFeatureFlag, withFeatureFlag } from '../featureFlags.react';

// Mock feature flags module
import { TEST_FLAGS } from './testFlags';
vi.mock('../featureFlags.config', () => {
  return {
    FEATURE_FLAGS: TEST_FLAGS,
  };
});

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

describe('Feature Flag React Integration', () => {
  beforeEach(() => {
    // Reset localStorage
    mockLocalStorage.clear();

    // Mock storage
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
    });

    // Mock location
    Object.defineProperty(window, 'location', {
      value: new URL('http://localhost:3000'),
    });

    // Reset singleton
    FeatureFlagManager['instance'] = null;
  });

  describe('useFeatureFlag hook', () => {
    it('returns correct initial state', () => {
      const TestComponent = () => {
        const enabled = useFeatureFlag('exportWizard');
        return <div data-testid="flag">{enabled.toString()}</div>;
      };

      render(<TestComponent />);
      expect(screen.getByTestId('flag')).toHaveTextContent('true');
    });

    it('updates when flag changes', () => {
      const manager = FeatureFlagManager.getInstance();

      const TestComponent = () => {
        const enabled = useFeatureFlag('exportWizard');
        return <div data-testid="flag">{enabled.toString()}</div>;
      };

      render(<TestComponent />);
      expect(screen.getByTestId('flag')).toHaveTextContent('true');

      // Simulate storage event
      act(() => {
        manager.setEnabled('exportWizard', false);
        window.dispatchEvent(
          new StorageEvent('storage', {
            key: 'inkwell_flag_exportWizard',
            newValue: 'false',
          }),
        );
      });

      expect(screen.getByTestId('flag')).toHaveTextContent('false');
    });
  });

  describe('FeatureGate component', () => {
    const manager = FeatureFlagManager.getInstance();

    it('renders children when feature is enabled', () => {
      manager.setEnabled('exportWizard', true);

      render(
        <FeatureGate flagKey="exportWizard">
          <div data-testid="content">Feature Content</div>
        </FeatureGate>,
      );

      expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('renders fallback when feature is disabled', () => {
      manager.setEnabled('exportWizard', false);

      render(
        <FeatureGate
          flagKey="exportWizard"
          fallback={<div data-testid="fallback">Fallback Content</div>}
        >
          <div data-testid="content">Feature Content</div>
        </FeatureGate>,
      );

      expect(screen.getByTestId('fallback')).toBeInTheDocument();
      expect(screen.queryByTestId('content')).not.toBeInTheDocument();
    });

    it('renders nothing when disabled with no fallback', () => {
      manager.setEnabled('exportWizard', false);

      render(
        <FeatureGate flagKey="exportWizard">
          <div data-testid="content">Feature Content</div>
        </FeatureGate>,
      );

      expect(screen.queryByTestId('content')).not.toBeInTheDocument();
    });
  });

  describe('withFeatureFlag HOC', () => {
    const TestComponent = (props: { message: string }) => (
      <div data-testid="content">{props.message}</div>
    );

    const FallbackComponent = (props: { message: string }) => (
      <div data-testid="fallback">{props.message}</div>
    );

    it('renders component when feature is enabled', () => {
      const manager = FeatureFlagManager.getInstance();
      manager.setEnabled('exportWizard', true);

      const WrappedComponent = withFeatureFlag('exportWizard', TestComponent);
      render(<WrappedComponent message="Hello" />);

      expect(screen.getByTestId('content')).toHaveTextContent('Hello');
    });

    it('renders fallback when feature is disabled', () => {
      const manager = FeatureFlagManager.getInstance();
      manager.setEnabled('exportWizard', false);

      const WrappedComponent = withFeatureFlag('exportWizard', TestComponent, FallbackComponent);
      render(<WrappedComponent message="Hello" />);

      expect(screen.getByTestId('fallback')).toHaveTextContent('Hello');
      expect(screen.queryByTestId('content')).not.toBeInTheDocument();
    });

    it('renders nothing when disabled with no fallback', () => {
      const manager = FeatureFlagManager.getInstance();
      manager.setEnabled('exportWizard', false);

      const WrappedComponent = withFeatureFlag('exportWizard', TestComponent);
      render(<WrappedComponent message="Hello" />);

      expect(screen.queryByTestId('content')).not.toBeInTheDocument();
    });

    it('sets correct display name', () => {
      const WrappedComponent = withFeatureFlag('exportWizard', TestComponent);
      expect(WrappedComponent.displayName).toBe('WithFeatureFlag(TestComponent)');
    });
  });
});
