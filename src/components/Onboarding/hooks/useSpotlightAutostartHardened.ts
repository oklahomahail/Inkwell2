/**
 * Tour autostart hook - race-free, never stalls
 * Defers tour start until router settled and anchors present
 */

import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

import { waitForAnchors } from '../../../tour/anchors';
import devLog from '../../../utils/devLog';

const DASHBOARD_PATH = '/';
const EXCLUDED_PATHS = ['/profiles'];
const MAX_RETRIES = 3;
const RETRY_DELAY = 100;

export interface AutostartOptions {
  /** Tour ID for tracking progress (optional) */
  tourId?: string;
  /** Callback to start the tour - receives tourId as parameter */
  onStartTour: (tourId?: string) => void;
  /** Custom logic to check if tour should start (optional) */
  shouldStart?: () => boolean;
  /** Excluded paths where tour should never start */
  excludedPaths?: string[];
  /** Dashboard path where tour can start */
  dashboardPath?: string;
}

/**
 * Hardened autostart hook that never races
 * - Only runs once per session
 * - Waits for anchors to be ready
 * - Has timeout protection
 * - Logs failures for observability
 *
 * @param stepSelectors - DOM selectors for tour anchors
 * @param options - Configuration options
 *
 * @example
 * ```ts
 * import { startDefaultTour } from '@/tour/tourEntry';
 *
 * useSpotlightAutostart(
 *   ['[data-spotlight="inbox"]', '[data-tour="editor"]'],
 *   { onStartTour: () => startDefaultTour() }
 * );
 * ```
 */
export function useSpotlightAutostart(stepSelectors: string[], options?: AutostartOptions) {
  const started = useRef(false);
  const retryCount = useRef(0);
  const loc = useLocation();

  const {
    tourId,
    onStartTour,
    shouldStart = () => true,
    excludedPaths = EXCLUDED_PATHS,
    dashboardPath = DASHBOARD_PATH,
  } = options || {};

  useEffect(() => {
    // Skip if no selectors or no start callback
    if (stepSelectors.length === 0 || !onStartTour) {
      return;
    }

    // Guard: only run once per session
    if (started.current) return;

    // Skip on excluded paths
    if (excludedPaths.some((path) => loc.pathname.startsWith(path))) return;

    // Only run on dashboard
    if (!loc.pathname.startsWith(dashboardPath)) return;

    // Check custom shouldStart logic
    if (!shouldStart()) return;

    // Mark as started to prevent double-run
    started.current = true;

    // Use RAF + microtask pattern for maximum stability
    let rafId = 0;
    let timeoutId = 0;

    const attemptStart = async () => {
      try {
        // Wait for anchors to be ready (with timeout)
        const ready = await waitForAnchors(stepSelectors, { timeout: 1000 });

        if (!ready) {
          // Log failure for observability
          devLog.debug('[Tour] Autostart failed - anchors not ready', {
            tourId,
            selectors: stepSelectors,
            path: loc.pathname,
            retries: retryCount.current,
          });

          // Retry up to MAX_RETRIES times
          if (retryCount.current < MAX_RETRIES) {
            retryCount.current++;
            timeoutId = window.setTimeout(attemptStart, RETRY_DELAY * retryCount.current);
          } else {
            devLog.debug('[Tour] Autostart abandoned after max retries', { tourId });
          }
          return;
        }

        // Anchors ready - start tour
        try {
          onStartTour(tourId);
          devLog.debug('[Tour] Autostart successful', { tourId, path: loc.pathname });
        } catch (error) {
          devLog.debug('[Tour] Failed to start tour', {
            tourId,
            error: error instanceof Error ? error.message : String(error),
            selectors: stepSelectors,
            path: loc.pathname,
          });
        }
      } catch (error) {
        devLog.debug('[Tour] Autostart error', {
          tourId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    };

    // Start attempt on next frame
    rafId = requestAnimationFrame(() => {
      queueMicrotask(attemptStart);
    });

    // Cleanup
    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timeoutId);
    };
  }, [loc.pathname, stepSelectors, onStartTour, shouldStart, excludedPaths, dashboardPath, tourId]);
}
