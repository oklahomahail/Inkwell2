/**
 * Tour Lifecycle Integration
 *
 * Connects tour events to analytics and persistence.
 * Mount this component once near the app root to enable tour tracking.
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import devLog from "@/utils/devLog";

import { isTourDone } from '../persistence';
import { startDefaultTour } from '../tourEntry';

const FIRST_RUN_KEY = 'inkwell:firstRunShown';

/**
 * Integrates tour lifecycle events with analytics and persistence.
 *
 * This component subscribes to TourService events and:
 * - Tracks analytics events (started, step_viewed, completed, skipped)
 * - Persists completion state to localStorage
 * - Auto-starts the tour on first visit to dashboard
 * - Handles cleanup on unmount
 *
 * Mount once in your app root:
 * ```tsx
 * export default function App() {
 *   return (
 *     <>
 *       <TourLifecycleIntegration />
 *       <YourApp />
 *     </>
 *   );
 * }
 * ```
 */
export function TourLifecycleIntegration(): null {
  const { pathname } = useLocation();

  useEffect(() => {
    // Only consider auto-start on the dashboard, never on /settings or auth routes
    const onDashboard = pathname === '/dashboard';
    const alreadyShown = localStorage.getItem(FIRST_RUN_KEY) === '1';
    const done = isTourDone('DEFAULT_TOUR_ID');

    if (onDashboard && !alreadyShown && !done) {
      // Small delay so anchors exist (post-layout)
      // Use requestAnimationFrame + setTimeout to ensure elements are rendered
      requestAnimationFrame(() => {
        setTimeout(() => {
          devLog.debug('[TourLifecycle] Auto-starting tour for first-time user');
          startDefaultTour();
          localStorage.setItem(FIRST_RUN_KEY, '1');
        }, 200);
      });
    }
  }, [pathname]);

  return null;
}
