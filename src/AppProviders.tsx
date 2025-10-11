import { Suspense } from 'react';

import { TourProvider } from './features/tour/TourContext';

function _AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <TourProvider>{children}</TourProvider>
    </Suspense>
  );
}

// Named export
export const AppProviders = _AppProviders;

// Default export for legacy compatibility
export default _AppProviders;
