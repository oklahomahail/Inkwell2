// src/hooks/useTourStateHydration.ts
import { useEffect } from 'react';

import { useAuth } from '../context/AuthContext';
import { createTourStorage } from '../services/simpleTourStorage';

/**
 * Hook to handle tour state hydration when profiles change
 */
export function useTourStateHydration() {
  const { user } = useAuth();
  const profileId = user?.id;

  useEffect(() => {
    if (!profileId) return;

    // When profile changes, initialize storage for new profile
    const storage = createTourStorage('default');

    // Hydrate any existing progress
    const simpleProgress = storage.getTourProgress('simple');
    const spotlightProgress = storage.getTourProgress('spotlight');

    // If tours were in progress, reset them (since profile changed)
    if (!simpleProgress.seen && simpleProgress.step > 0) {
      storage.resetTour('simple');
    }
    if (!spotlightProgress.seen && spotlightProgress.step > 0) {
      storage.resetTour('spotlight');
    }
  }, [profileId]);
}
