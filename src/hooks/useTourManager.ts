// src/hooks/useTourManager.ts
import { useCallback, useRef } from 'react';

import devLog from '@/utils/devLog';

import { waitForElement } from '../utils/domUtils';

// Stub function for spotlight tour UI - should be implemented by tour overlay component
function showSpotlight(element: HTMLElement, content: React.ReactNode): Promise<void> {
  devLog.debug('Spotlight tour step:', element, content);
  // In a real implementation, this would show a spotlight overlay
  // and resolve when the user clicks next or dismisses
  return Promise.resolve();
}

interface TourStep {
  id: string;
  content: React.ReactNode;
}

export function useTourManager() {
  const startedRef = useRef<Record<string, boolean>>({
    simple: false,
    spotlight: false,
  });

  const startTour = useCallback((tour: string) => {
    if (startedRef.current[tour]) return;
    startedRef.current[tour] = true;
    // storage.startTour(tour); // storage is removed
  }, []);

  const endTour = useCallback((tour: string) => {
    // storage.endTour(tour); // storage is removed
    startedRef.current[tour] = false;
  }, []);

  const setTourStep = useCallback((_tour: string, _step: number) => {
    // storage.setTourStep(tour, step); // storage is removed
    // _tour and _step are intentionally unused for now
  }, []);

  const resetTour = useCallback((tour: string) => {
    // storage.resetTour(tour); // storage is removed
    startedRef.current[tour] = false;
  }, []);

  const runSpotlight = useCallback(
    async (steps: TourStep[]) => {
      const tour: string = 'spotlight';
      startTour(tour);

      try {
        for (let i = 0; i < steps.length; i++) {
          const sel = `[data-tour-id="${steps[i]?.id}"]`;
          const el = await waitForElement(sel).catch(() => null);
          if (!el) continue; // Skip missing targets

          // These functions will be implemented in TourOverlay component
          await showSpotlight(el, steps[i]?.content);
          // storage.setTourStep(tour, i + 1); // storage is removed
        }
        endTour(tour);
      } catch (error) {
        console.error('Error running spotlight tour:', error);
        endTour(tour);
      }
    },
    [startTour, endTour],
  );

  return {
    startTour,
    endTour,
    setTourStep,
    resetTour,
    runSpotlight,
  };
}
