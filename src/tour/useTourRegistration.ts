import { useEffect } from 'react';

import devLog from "@/utils/devLog";
// src/tour/useTourRegistration.ts - Hook to register tours on app boot


import { registerTours, bindTourShortcut, handleTourDeepLink } from './tourLauncher';

/**
 * Hook to register all tours and set up global tour infrastructure
 * Call this once at the root of your app
 */
export function useTourRegistration() {
  useEffect(() => {
    // Register the Spotlight Tour (the only tour in the app)
    registerTours({
      spotlight: {
        start: (opts) => {
          devLog.debug('[useTourRegistration] Starting Spotlight Tour', opts);

          // Dispatch custom event that the tour provider can listen to
          const event = new CustomEvent('inkwell:start-tour', {
            detail: { tourId: 'spotlight', opts },
          });
          window.dispatchEvent(event);
        },
        reset: () => {
          devLog.debug('[useTourRegistration] Resetting Spotlight Tour');

          const event = new CustomEvent('inkwell:reset-tour', {
            detail: { tourId: 'spotlight' },
          });
          window.dispatchEvent(event);
        },
      },
    });

    // Bind keyboard shortcuts
    bindTourShortcut();

    // Handle deep links from URL
    handleTourDeepLink();

    devLog.debug('[useTourRegistration] Tour system initialized');
  }, []);
}
