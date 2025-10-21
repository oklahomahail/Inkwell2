// src/hooks/useTourStartupFromUrl.ts
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

import { triggerDashboardView } from '@/utils/tourTriggers';

/**
 * Hook to check URL for tour=start parameter and trigger the tour if present
 * This makes deep linking to /dashboard?tour=start possible
 */
export function useTourStartupFromUrl(): void {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const shouldStartTour = searchParams.get('tour') === 'start';

    if (shouldStartTour) {
      // Small delay to ensure components are mounted
      const timer = setTimeout(() => {
        console.log('[Tour] Starting tour from URL parameter');
        triggerDashboardView();
      }, 500);

      return () => clearTimeout(timer);
    }

    return undefined;
  }, [searchParams]);
}
