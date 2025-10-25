// src/tour/useTourRegistration.ts - Hook to register tours on app boot

import { useEffect } from 'react';

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
          console.log('[useTourRegistration] Starting Spotlight Tour', opts);

          // Dispatch custom event that the tour provider can listen to
          const event = new CustomEvent('inkwell:start-tour', {
            detail: { tourId: 'spotlight', opts },
          });
          window.dispatchEvent(event);
        },
        reset: () => {
          console.log('[useTourRegistration] Resetting Spotlight Tour');

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

    console.log('[useTourRegistration] Tour system initialized');
  }, []);
}
