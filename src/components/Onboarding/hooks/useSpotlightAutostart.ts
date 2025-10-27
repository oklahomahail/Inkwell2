// src/components/Onboarding/useSpotlightAutostart.ts
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

import { safeObserve } from '../../../utils/dom/safeObserver';

import { startTour, isTourRunning } from './TourController';
import { getTourProgress, resetProgress, markTourLaunched } from './useTutorialStorage';

const FEATURE_TOUR_ID = 'feature-tour';
const DASHBOARD_PATH = '/'; // Main dashboard path
const EXCLUDED_PATHS = ['/profiles']; // Paths where tours should not run

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

    // Create observer with safer approach
    let observer: MutationObserver | null = null;
    try {
      observer = new MutationObserver(() => {
        if (targetsExist(selectors)) finalize(true);
        else if (Date.now() > deadline) finalize(false);
      });

      // Use safeObserve utility to prevent crashes
      const observed = safeObserve(observer, node, { childList: true, subtree: true });

      if (!observed) {
        // If observation fails, use timeout fallback
        setTimeout(() => finalize(targetsExist(selectors)), 100);
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

    // Skip tour on excluded paths (like /profiles)
    if (EXCLUDED_PATHS.some((path) => loc.pathname.startsWith(path))) return;

    // Only run on main dashboard path
    if (!loc.pathname.startsWith(DASHBOARD_PATH)) return;

    if (isTourRunning()) return;

    const progress = (getTourProgress(FEATURE_TOUR_ID) || {}) as { completed?: boolean };
    // Only auto-start if user has never completed it
    const shouldAutostart = !progress.completed && !sessionStorage.getItem('tour:feature:blocked');

    if (!shouldAutostart) return;
    once.current = true;

    // Use requestAnimationFrame to ensure the DOM is fully rendered before checking
    // This helps avoid issues with MutationObserver by waiting for a paint cycle
    requestAnimationFrame(() => {
      // Then queue a microtask for additional safety
      queueMicrotask(async () => {
        const ok = await whenTargetsReady(stepSelectors);
        if (!ok) {
          // If a stale progress record is blocking, allow a one-time reset
          resetProgress(FEATURE_TOUR_ID);
          return; // silently bail if targets never appear
        }

        try {
          startTour(FEATURE_TOUR_ID); // TourController has its own global double-start guard
          markTourLaunched(FEATURE_TOUR_ID);
        } catch (error) {
          console.error('Error starting tour:', error);
        }
      });
    });
  }, [loc.pathname, stepSelectors]);
}
