import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

import { useUIReady } from '@/context/AppContext';

import { TourController } from '../tour-core/TourController';
import { debugTour } from '../utils/debug';
import { shouldBlockTourHere } from '../utils/routeGuards';
import { hasStartedOnce, markStarted } from '../utils/tourOnce';

import { isSuppressed } from './tourHookUtils';

export function useSimpleTourAutostart(profileId?: string) {
  const location = useLocation();
  const { isReady } = useUIReady();
  const effectiveProfileId = profileId ?? 'default';
  const localData = {
    completed: localStorage.getItem('tourProgress.simple.completed') === 'true',
    dismissed: localStorage.getItem('tourProgress.simple.dismissed') === 'true',
  };
  const gateRef = useRef({ started: false, token: 0 });

  useEffect(() => {
    if (isSuppressed()) {
      debugTour('autostart:suppressed', { route: location.pathname });
      return;
    }
    // Check both window.location and React Router location for route blocking
    if (shouldBlockTourHere(window.location) || shouldBlockTourHere(location)) {
      debugTour('autostart:blocked', { route: location.pathname, tour: 'simple' });
      return;
    }
    if (!isReady) return;
    if (gateRef.current.started) {
      debugTour('autostart:ref-guard-hit', { tour: 'simple' });
      return;
    }
    if (localData.completed || localData.dismissed) return;
    if (hasStartedOnce(effectiveProfileId, 'simple')) {
      debugTour('autostart:once-guard-hit', { tour: 'simple' });
      return;
    }

    const myToken = ++gateRef.current.token;

    queueMicrotask(async () => {
      if (gateRef.current.started || gateRef.current.token !== myToken) {
        debugTour('autostart:token-mismatch', {
          tour: 'simple',
          myToken,
          token: gateRef.current.token,
        });
        return;
      }

      // Start tour via controller singleton
      const ok = await TourController.startTour('simple', effectiveProfileId);
      if (!ok) return;

      gateRef.current.started = true;
      markStarted(effectiveProfileId, 'simple');
      localStorage.setItem('tourProgress.simple.lastAutostartAt', String(Date.now()));
      debugTour('autostart:started', { tour: 'simple', route: location.pathname });
    });
  }, [location, isReady, effectiveProfileId]);
}
