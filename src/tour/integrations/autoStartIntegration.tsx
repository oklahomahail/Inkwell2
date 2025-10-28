/**
 * Auto-Start Tour Integration (Hardened)
 *
 * Handles automatic tour launching for first-time users with robust DOM readiness checks.
 * Only triggers after onboarding is complete and user is on dashboard.
 */

import { useSpotlightAutostart } from '@/components/Onboarding/hooks/useSpotlightAutostartHardened';

import { shouldAutoStartTour, startDefaultTour } from '../tourEntry';

/**
 * Auto-start tour integration component
 *
 * Mount this in App.tsx to enable automatic tour launching for first-time users.
 * The tour will only auto-start:
 * - On the dashboard route
 * - If the tour hasn't been completed before
 * - Once per session
 * - After all required DOM anchors are ready
 *
 * Uses the hardened useSpotlightAutostart hook to prevent race conditions.
 */
export function AutoStartTourIntegration() {
  // These selectors should match the first few steps of the default tour
  // Adjust based on your tour configuration
  const tourAnchors = [
    '[data-spotlight="inbox"]',
    '[data-spotlight="new-story"]',
    '[data-tour="editor-toggle"]',
  ];

  // Use hardened autostart hook
  useSpotlightAutostart(tourAnchors, {
    tourId: 'default-tour',
    onStartTour: startDefaultTour,
    shouldStart: shouldAutoStartTour,
    excludedPaths: ['/settings', '/auth'],
    dashboardPath: '/dashboard',
  });

  // This is a logic-only component, no UI
  return null;
}
