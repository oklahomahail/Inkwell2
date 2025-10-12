import React from 'react';

import { FeatureFlagManager } from './FeatureFlagManager';

const manager = FeatureFlagManager.getInstance();

/**
 * React hook to access feature flag state
 */
export function useFeatureFlag(flagKey: string): boolean {
  const [enabled, setEnabled] = React.useState(() => manager.isEnabled(flagKey));

  React.useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `inkwell_flag_${flagKey}`) {
        setEnabled(manager.isEnabled(flagKey));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [flagKey]);

  return enabled;
}

/**
 * Component to conditionally render based on feature flag
 */
export function FeatureGate({
  flagKey,
  children,
  fallback = null,
}: {
  flagKey: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}): JSX.Element | null {
  const enabled = useFeatureFlag(flagKey);
  return enabled ? <>{children}</> : <>{fallback}</>;
}

/**
 * HOC to wrap components with feature flag checks
 */
export function withFeatureFlag<P extends Record<string, any>>(
  flagKey: string,
  WrappedComponent?: React.ComponentType<P>,
  FallbackComponent?: React.ComponentType<P>,
): React.ComponentType<P> {
  if (!WrappedComponent) {
    console.warn(
      `withFeatureFlag(${flagKey}): WrappedComponent is undefined. This may happen if the component failed to load or was not provided.`,
    );
    return FallbackComponent || (() => null);
  }

  function FeatureFlaggedComponent(props: P) {
    const enabled = useFeatureFlag(flagKey);

    if (enabled && WrappedComponent) {
      return <WrappedComponent {...props} />;
    }

    if (FallbackComponent) {
      return <FallbackComponent {...props} />;
    }

    return null;
  }

  if (WrappedComponent) {
    FeatureFlaggedComponent.displayName = `WithFeatureFlag(${
      WrappedComponent.displayName || WrappedComponent.name || 'Component'
    })`;
  } else {
    FeatureFlaggedComponent.displayName = 'WithFeatureFlag(Undefined)';
  }

  return FeatureFlaggedComponent;
}

/**
 * Provider component for feature flag context
 */
const FeatureFlagContext = React.createContext<FeatureFlagManager>(manager);

export function FeatureFlagProvider({ children }: { children: React.ReactNode }) {
  return <FeatureFlagContext.Provider value={manager}>{children}</FeatureFlagContext.Provider>;
}

/**
 * Hook to access the feature flag manager directly
 */
export function useFeatureFlags() {
  return React.useContext(FeatureFlagContext);
}

// Export a direct reference to the manager for non-React usage
export const featureFlags = manager;
