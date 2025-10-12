import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

import { useUIReady } from '@/context/AppContext';
import { TourStorage } from '@/services/TourStorage';

import { TourController } from '../tour-core/TourController';
import { isProfilesRoute } from '../utils/routeGuards';
import { hasStartedOnce, markStarted } from '../utils/tourOnce';
import { waitForElement } from '../utils/waitForElement';

interface StartOpts {
  timeoutMs?: number;
}

export function useSpotlightAutostart(opts: StartOpts = {}) {
  const { timeoutMs = 8000 } = opts;
  const location = useLocation();
  const uiReady = useUIReady();
  const startedRef = useRef(false);
  const storage = TourStorage.forCurrentProfile();
  const profileId = storage.profileId;

  useEffect(() => {
    if (startedRef.current) return;
    if (!uiReady) return;
    if (isProfilesRoute(location)) return;
    if (storage.get('spotlightTour.completed')) return;
    if (storage.get('spotlightTour.dismissed')) return;
    if (hasStartedOnce(profileId, 'spotlight')) return;

    let cancelled = false;

    (async () => {
      const steps = TourController.getSteps('spotlight');
      const firstWithSelector = steps.find((s) => s.target);
      if (!firstWithSelector) {
        console.warn('[SpotlightTour] No steps with a target selector.');
        return;
      }

      try {
        const el = await waitForElement(firstWithSelector.target!, {
          timeout: timeoutMs,
          pollEveryMs: 100,
          root: document,
        });

        if (cancelled) return;
        if (!el) {
          console.warn('[SpotlightTour] Target never appeared:', firstWithSelector.target);
          return;
        }

        const unresolved = steps
          .filter((s) => s.target)
          .filter((s) => !document.querySelector(s.target!))
          .map((s) => s.target);
        if (unresolved.length) {
          console.debug('[SpotlightTour] Unresolved selectors:', unresolved);
          return;
        }

        TourController.start('spotlight');
        startedRef.current = true;
        markStarted(profileId, 'spotlight');
      } catch (e) {
        console.warn('[SpotlightTour] waitForElement failed', e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [location, uiReady, timeoutMs, storage, profileId]);
}
