// src/hooks/useTourManager.ts
import { useCallback, useRef } from 'react';

import { useProfile } from '../context/ProfileContext';
import { createTourStorage, TourName, TourProgress } from '../services/TourStorage';
import { waitForElement } from '../utils/domUtils';

interface TourStep {
  id: string;
  content: React.ReactNode;
}

export function useTourManager() {
  const { profileId } = useProfile();
  const storage = createTourStorage(profileId);
  const startedRef = useRef<Record<TourName, boolean>>({
    simple: false,
    spotlight: false,
  });

  const getTourProgress = useCallback(
    (tour: TourName): TourProgress => {
      return storage.getTourProgress(tour);
    },
    [storage],
  );

  const startTour = useCallback(
    (tour: TourName) => {
      if (startedRef.current[tour]) return;
      startedRef.current[tour] = true;
      storage.startTour(tour);
    },
    [storage],
  );

  const endTour = useCallback(
    (tour: TourName) => {
      storage.endTour(tour);
      startedRef.current[tour] = false;
    },
    [storage],
  );

  const setTourStep = useCallback(
    (tour: TourName, step: number) => {
      storage.setTourStep(tour, step);
    },
    [storage],
  );

  const resetTour = useCallback(
    (tour: TourName) => {
      storage.resetTour(tour);
      startedRef.current[tour] = false;
    },
    [storage],
  );

  const runSpotlight = useCallback(
    async (steps: TourStep[]) => {
      const tour: TourName = 'spotlight';
      startTour(tour);

      try {
        for (let i = storage.getTourProgress(tour).step; i < steps.length; i++) {
          const sel = `[data-tour-id="${steps[i].id}"]`;
          const el = await waitForElement(sel).catch(() => null);
          if (!el) continue; // Skip missing targets

          // These functions will be implemented in TourOverlay component
          await showSpotlight(el, steps[i].content);
          storage.setTourStep(tour, i + 1);
        }
        endTour(tour);
      } catch (error) {
        console.error('Error running spotlight tour:', error);
        endTour(tour);
      }
    },
    [startTour, endTour, storage],
  );

  return {
    getTourProgress,
    startTour,
    endTour,
    setTourStep,
    resetTour,
    runSpotlight,
  };
}
