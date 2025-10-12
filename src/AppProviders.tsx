import { Suspense } from 'react';

import { TourProvider } from './features/tour/TourContext';
import { FeatureFlagProvider } from './utils/featureFlags.react';

function _AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <FeatureFlagProvider>
        <TourProvider>{children}</TourProvider>
      </FeatureFlagProvider>
    </Suspense>
  );
}

// Named export
export const AppProviders = _AppProviders;

// Default export for legacy compatibility
export default _AppProviders;
