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

/**
 * Wait for React to mount to the #root element before proceeding with tour.
 * This ensures the React application is fully mounted and hydrated before
 * we start looking for tour target elements.
 *
 * @param timeout - Maximum time to wait for React mount (default 5000ms)
 * @returns Promise<boolean> - true if React mounted, false if timeout
 */
function waitForReactMount(timeout = 5000): Promise<boolean> {
  return new Promise((resolve) => {
    const root = document.getElementById('root');
    if (!root) {
      console.warn('[waitForReactMount] #root element not found');
      resolve(false);
      return;
    }

    // Check if React has already mounted
    if (root.childNodes.length > 0) {
      // Additional check: ensure it's not just a loading state
      const hasReactContent =
        root.querySelector('[data-reactroot], [data-react-root]') || root.children.length > 0;

      if (hasReactContent) {
        resolve(true);
        return;
      }
    }

    // Watch for React mount
    const observer = new MutationObserver(() => {
      if (root.childNodes.length > 0) {
        observer.disconnect();
        // Give React one more frame to hydrate
        requestAnimationFrame(() => {
          resolve(true);
        });
      }
    });

    observer.observe(root, { childList: true, subtree: true });

    // Timeout fallback
    setTimeout(() => {
      observer.disconnect();
      resolve(root.childNodes.length > 0);
    }, timeout);
  });
}

async function whenTargetsReady(selectors: string[], timeoutMs = 8000): Promise<boolean> {
  // Step 1: Wait for React root to mount
  const reactMounted = await waitForReactMount(3000);
  if (!reactMounted) {
    console.warn('[whenTargetsReady] React mount timeout - tour may not display correctly');
    return false;
  }

  // Step 2: Wait one more frame for layout paint
  await new Promise((resolve) => requestAnimationFrame(resolve));

  // Step 3: Check if targets exist (quick path after React mount)
  if (targetsExist(selectors)) {
    return true;
  }

  // Step 4: Guard against missing document.documentElement (e.g. during auth flows or SSR)
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

    // Guard: ensure node exists before creating observer
    if (!node) {
      console.warn('waitForTargets: document.documentElement is not available');
      finalize(false);
      return;
    }

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

    // Enhanced tour start flow with DOM readiness checking
    const startTourFlow = async () => {
      // Step 1: Wait for DOM ready if needed
      if (document.readyState === 'loading') {
        await new Promise<void>((resolve) => {
          document.addEventListener('DOMContentLoaded', () => resolve(), { once: true });
        });
      }

      // Step 2: Wait for targets to be ready (includes React mount detection)
      const ok = await whenTargetsReady(stepSelectors);
      if (!ok) {
        // If a stale progress record is blocking, allow a one-time reset
        resetProgress(FEATURE_TOUR_ID);
        return; // silently bail if targets never appear
      }

      // Step 3: Start the tour
      try {
        startTour(FEATURE_TOUR_ID); // TourController has its own global double-start guard
        markTourLaunched(FEATURE_TOUR_ID);
      } catch (error) {
        console.error('Error starting tour:', error);
      }
    };

    startTourFlow();
  }, [loc.pathname, stepSelectors]);
}
