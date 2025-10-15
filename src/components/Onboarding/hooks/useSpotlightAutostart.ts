// src/components/Onboarding/useSpotlightAutostart.ts
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

import { startTour, isTourRunning } from './TourController';
import { getTourProgress, resetProgress, markTourLaunched } from './useTutorialStorage';

const FEATURE_TOUR_ID = 'feature-tour';
const DASHBOARD_PATH = '/profiles';

function targetsExist(selectors: string[]) {
  return selectors.every((sel) => !!document.querySelector(sel));
}

function whenTargetsReady(selectors: string[], timeoutMs = 8000): Promise<boolean> {
  // quick path
  if (targetsExist(selectors)) return Promise.resolve(true);
  return new Promise((resolve) => {
    const deadline = Date.now() + timeoutMs;
    const observer = new MutationObserver(() => {
      if (targetsExist(selectors)) finalize(true);
      else if (Date.now() > deadline) finalize(false);
    });
    const finalize = (ok: boolean) => {
      observer.disconnect();
      resolve(ok);
    };
    observer.observe(document.documentElement, { childList: true, subtree: true });
    // last-chance check on macrotask
    setTimeout(() => finalize(targetsExist(selectors)), timeoutMs);
  });
}

export function useSpotlightAutostart(stepSelectors: string[]) {
  const once = useRef(false);
  const loc = useLocation();

  useEffect(() => {
    if (once.current) return;
    if (!loc.pathname.startsWith(DASHBOARD_PATH)) return;
    if (isTourRunning()) return;

    const progress = (getTourProgress(FEATURE_TOUR_ID) || {}) as { completed?: boolean };
    // Only auto-start if user has never completed it
    const shouldAutostart = !progress.completed && !sessionStorage.getItem('tour:feature:blocked');

    if (!shouldAutostart) return;
    once.current = true;

    // Give the page a tick to mount panels, then wait for targets
    queueMicrotask(async () => {
      const ok = await whenTargetsReady(stepSelectors);
      if (!ok) return; // silently bail if targets never appear

      try {
        startTour(FEATURE_TOUR_ID); // TourController has its own global double-start guard
        markTourLaunched(FEATURE_TOUR_ID);
      } catch {
        // If a stale progress record is blocking, allow a one-time reset
        resetProgress(FEATURE_TOUR_ID);
      }
    });
  }, [loc.pathname, stepSelectors]);
}
