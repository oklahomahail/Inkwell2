import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

import { useUIReady } from '@/context/AppContext';
import { TourStorage } from '@/services/TourStorage';

import { TourController } from '../tour-core/TourController';
import { debugTour } from '../utils/debug';
import { shouldBlockTourHere } from '../utils/routeGuards';
import { hasStartedOnce, markStarted } from '../utils/tourOnce';
import { waitForElement } from '../utils/waitForElement';

import { isSuppressed } from './tourHookUtils';

interface StartOpts {
  timeoutMs?: number;
}

export function useSpotlightAutostart(profileId?: string, opts: StartOpts = {}) {
  const { timeoutMs = 8000 } = opts;
  const location = useLocation();
  const uiReady = useUIReady();
  const storage = TourStorage.forCurrentProfile();
  const effectiveProfileId = profileId ?? storage.profileId ?? 'default';
  const gateRef = useRef({ started: false, token: 0 });

  useEffect(() => {
    if (isSuppressed()) {
      debugTour('autostart:suppressed', { route: location.pathname });
      return;
    }
    if (shouldBlockTourHere(location)) {
      debugTour('autostart:blocked', { route: location.pathname, tour: 'spotlight' });
      return;
    }
    if (!uiReady) return;
    if (gateRef.current.started) {
      debugTour('autostart:ref-guard-hit', { tour: 'spotlight' });
      return;
    }
    if (storage.get('spotlightTour.completed') || storage.get('spotlightTour.dismissed')) return;
    if (hasStartedOnce(effectiveProfileId, 'spotlight')) {
      debugTour('autostart:once-guard-hit', { tour: 'spotlight' });
      return;
    }

    let cancelled = false;
    const myToken = ++gateRef.current.token;

    (async () => {
      const steps = TourController.getSteps('spotlight');
      const firstWithSelector = steps.find((s) => s.target);
      if (!firstWithSelector) {
        debugTour('autostart:no-steps', { tour: 'spotlight' });
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
          debugTour('autostart:no-target', { tour: 'spotlight', target: firstWithSelector.target });
          return;
        }

        const unresolved = steps
          .filter((s) => s.target)
          .filter((s) => !document.querySelector(s.target!))
          .map((s) => s.target);
        if (unresolved.length) {
          debugTour('autostart:unresolved-targets', { tour: 'spotlight', unresolved });
          return;
        }

        queueMicrotask(async () => {
          if (gateRef.current.started || gateRef.current.token !== myToken) {
            debugTour('autostart:token-mismatch', {
              tour: 'spotlight',
              myToken,
              token: gateRef.current.token,
            });
            return;
          }

          const ok = await TourController.startTour('spotlight', effectiveProfileId);
          if (!ok) return;

          gateRef.current.started = true;
          markStarted(effectiveProfileId, 'spotlight');
          debugTour('autostart:started', { tour: 'spotlight', route: location.pathname });
        });
      } catch (e) {
        debugTour('autostart:error', { tour: 'spotlight', error: e });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [location, uiReady, timeoutMs, storage, effectiveProfileId]);
}
