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

  // Guard against missing document.documentElement (e.g. during auth flows or SSR)
  if (!document || !document.documentElement) {
    console.warn('whenTargetsReady: document.documentElement is not available');
    return Promise.resolve(false);
  }

  // Create promise to control when we're ready
  return new Promise<boolean>((finalize) => {
    // SSR guard
    if (typeof window === 'undefined') {
      finalize(false);
      return;
    }

    // Early return if we can already find the target
    if (targetsExist(selectors)) {
      finalize(true);
      return;
    }

    // Set up the deadline
    const deadline = Date.now() + timeoutMs;

    // Get the root node to observe
    const node = document.documentElement;
    if (!node || !(node instanceof Node)) {
      console.warn('whenTargetsReady: document.documentElement is not a Node');
      setTimeout(() => finalize(targetsExist(selectors)), 100); // Fallback to simple timeout
      return;
    }

    // Create observer after we know we have a valid node
    let observer: MutationObserver | null = null;
    try {
      observer = new MutationObserver(() => {
        if (targetsExist(selectors)) finalize(true);
        else if (Date.now() > deadline) finalize(false);
      });

      try {
        observer.observe(node, { childList: true, subtree: true });
      } catch (e) {
        console.warn('[MO] observe skipped, invalid node', e, node);
        setTimeout(() => finalize(targetsExist(selectors)), 100); // Fallback
        return;
      }
    } catch (error) {
      console.warn('MutationObserver failed:', error);
      setTimeout(() => finalize(targetsExist(selectors)), 100); // Try one more time
      return;
    }

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
