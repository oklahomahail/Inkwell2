// src/hooks/useTourStartupFromUrl.ts
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

import devLog from "@/utils/devLog";
import { triggerDashboardView } from '@/utils/tourTriggers';

/**
 * Hook to check URL for tour=start parameter and trigger the tour if present
 * Also checks localStorage for tour flag set by auth callback
 * This makes deep linking to /dashboard?tour=start possible and handles
 * post-signup tour auto-start
 */
export function useTourStartupFromUrl(): void {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const shouldStartTourFromUrl = searchParams.get('tour') === 'start';
    const shouldStartTourFromFlag = localStorage.getItem('inkwell.spotlight.start') === '1';

    if (shouldStartTourFromUrl || shouldStartTourFromFlag) {
      // Clear the localStorage flag if it was set
      if (shouldStartTourFromFlag) {
        localStorage.removeItem('inkwell.spotlight.start');
        devLog.debug('[Tour] Starting tour from localStorage flag (post-signup)');
      } else {
        devLog.debug('[Tour] Starting tour from URL parameter');
      }

      // Small delay to ensure components are mounted
      const timer = setTimeout(() => {
        triggerDashboardView();
        // Mark that user has seen the spotlight tour
        localStorage.setItem('inkwell.spotlight.seen', '1');
      }, 500);

      return () => clearTimeout(timer);
    }

    return undefined;
  }, [searchParams]);
}
