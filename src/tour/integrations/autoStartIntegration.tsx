/**
 * Auto-Start Tour Integration
 *
 * Handles automatic tour launching for first-time users.
 * Only triggers after onboarding is complete and user is on dashboard.
 */

import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

import { shouldAutoStartTour, startDefaultTour } from '../tourEntry';

/**
 * Auto-start tour integration component
 *
 * Mount this in App.tsx to enable automatic tour launching for first-time users.
 * The tour will only auto-start:
 * - On the dashboard route
 * - If the tour hasn't been completed before
 * - Once per session
 */
export function AutoStartTourIntegration() {
  const location = useLocation();
  const hasAttemptedAutoStart = useRef(false);

  useEffect(() => {
    // Only auto-start once per session
    if (hasAttemptedAutoStart.current) {
      return;
    }

    // Only auto-start on the dashboard
    if (location.pathname !== '/dashboard') {
      return;
    }

    // Check if the tour should auto-start
    if (!shouldAutoStartTour()) {
      hasAttemptedAutoStart.current = true;
      return;
    }

    // Add a small delay to ensure the page is fully loaded
    const timeoutId = setTimeout(() => {
      console.log('[AutoStartTour] Launching default tour for first-time user');
      startDefaultTour();
      hasAttemptedAutoStart.current = true;
    }, 1000); // 1 second delay to let the dashboard settle

    return () => clearTimeout(timeoutId);
  }, [location.pathname]);

  // This is a logic-only component, no UI
  return null;
}
