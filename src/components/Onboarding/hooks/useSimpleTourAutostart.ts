import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

import { useUIReady } from '@/context/AppContext';
import { TourStorage } from '@/services/TourStorage';

import { TourController } from '../tour-core/TourController';
import { isProfilesRoute } from '../utils/routeGuards';
import { hasStartedOnce, markStarted } from '../utils/tourOnce';

export function useSimpleTourAutostart() {
  const location = useLocation();
  const uiReady = useUIReady();
  const startedRef = useRef(false);
  const storage = TourStorage.forCurrentProfile();
  const profileId = storage.profileId;

  useEffect(() => {
    if (startedRef.current) return;
    if (!uiReady) return;
    if (isProfilesRoute(location)) return;
    if (storage.get('simpleTour.completed')) return;
    if (storage.get('simpleTour.dismissed')) return;
    if (hasStartedOnce(profileId, 'simple')) return;

    const id = window.setTimeout(() => {
      TourController.start('simple');
      startedRef.current = true;
      markStarted(profileId, 'simple');
      storage.set('simpleTour.lastAutostartAt', Date.now());
    }, 0);

    return () => clearTimeout(id);
  }, [location, uiReady, storage, profileId]);
}
