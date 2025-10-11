import { Suspense } from 'react';

import { TourProvider } from './features/tour/TourContext';

export function _AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <TourProvider>{children}</TourProvider>
    </Suspense>
  );
}
