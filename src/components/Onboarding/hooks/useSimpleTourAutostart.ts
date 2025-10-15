import { match } from 'path-to-regexp';
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

import { useUIReady } from '@/context/AppContext';

import { startTour } from '../tour-core/TourController';
import { debugTour } from '../utils/debug';
import { shouldBlockTourHere } from '../utils/routeGuards';
import { hasStartedOnce, markStarted } from '../utils/tourOnce';

import { isSuppressed } from './tourHookUtils';

// Allowlist of routes where autostart is permitted
const AUTOSTART_ALLOW = ['/p/:id/writing', '/p/:id/timeline', '/p/:id/analysis', '/p/:id/planning'];

function isAutostartAllowed(pathname: string) {
  return AUTOSTART_ALLOW.some((p) => match(p, { decode: decodeURIComponent })(pathname));
}

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
    if (!isAutostartAllowed(location.pathname)) {
      debugTour('autostart:not-allowed', { route: location.pathname, tour: 'simple' });
      return;
    }
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
      const ok = await startTour('simple', effectiveProfileId);
      if (!ok) return;

      gateRef.current.started = true;
      markStarted(effectiveProfileId, 'simple');
      localStorage.setItem('tourProgress.simple.lastAutostartAt', String(Date.now()));
      debugTour('autostart:started', { tour: 'simple', route: location.pathname });
    });
  }, [location, isReady, effectiveProfileId]);
}
