import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

import { useUIReady } from '@/context/AppContext';
import { TourStorage } from '@/services/TourStorage';

import { TourController } from '../tour-core/TourController';
import { waitForElement } from '../utils/waitForElement';

const AUTOSTART_BLOCKLIST = new Set<string>(['/profile', '/profile/edit']);

export function useAutostartSimpleTour() {
  const { pathname } = useLocation();
  const uiReady = useUIReady();
  const startedRef = useRef(false);
  const storage = TourStorage.forCurrentProfile();

  useEffect(() => {
    if (!uiReady) return;
    if (startedRef.current) return;
    if (AUTOSTART_BLOCKLIST.has(pathname)) return;
    if (storage.get('simpleTour.completed')) return;
    if (storage.get('simpleTour.dismissed')) return;

    const id = window.setTimeout(() => {
      TourController.start('simple');
      startedRef.current = true;
      storage.set('simpleTour.lastAutostartAt', Date.now());
    }, 0);

    return () => clearTimeout(id);
  }, [pathname, uiReady]);
}

interface StartOpts {
  timeoutMs?: number;
}

export function useSpotlightAutostart(opts: StartOpts = {}) {
  const { timeoutMs = 8000 } = opts;
  const uiReady = useUIReady();
  const storage = TourStorage.forCurrentProfile();

  useEffect(() => {
    if (!uiReady) return;
    if (storage.get('spotlightTour.completed')) return;
    if (storage.get('spotlightTour.dismissed')) return;

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
        }

        TourController.start('spotlight');
      } catch (e) {
        console.warn('[SpotlightTour] waitForElement failed', e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [uiReady]);
}
