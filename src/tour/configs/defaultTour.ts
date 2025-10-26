/**
 * Default Tour Configuration
 *
 * Defines the standard onboarding tour for new Inkwell users.
 * All targets must exist in the DOM with matching data-tour-id attributes.
 */

import type { TourStep } from '../types';

/**
 * Default Inkwell tour steps
 *
 * To add a new step:
 * 1. Add the step definition here
 * 2. Ensure the target element has the matching data-tour-id attribute
 * 3. Test that the element is visible when the tour reaches that step
 */
export const defaultTourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Inkwell',
    body: "Let's take a quick tour of the key features to help you get started.",
    selectors: ['[data-tour-id="dashboard"]', 'main'],
    placement: 'bottom',
  },
  {
    id: 'sidebar',
    title: 'Navigation',
    body: 'Switch between Dashboard, Writing, and other views using the sidebar.',
    selectors: ['[data-tour-id="sidebar"]', 'nav[aria-label="Main"]'],
    placement: 'right',
  },
  {
    id: 'topbar',
    title: 'Quick Actions',
    body: 'Access common actions, settings, and help from the top bar.',
    selectors: ['[data-tour-id="topbar"]', 'header'],
    placement: 'bottom',
  },
  {
    id: 'storage-banner',
    title: 'Storage Health',
    body: 'Watch for important notifications about storage, quota, and persistence.',
    selectors: ['[data-tour-id="storage-banner"]', '[role="alert"]'],
    placement: 'bottom',
    spotlightPadding: 16,
  },
  {
    id: 'focus-toggle',
    title: 'Focus Mode',
    body: 'Toggle Focus Mode for a distraction-free writing experience.',
    selectors: ['[data-tour-id="focus-toggle"]', '[aria-label*="Focus"]'],
    placement: 'left',
  },
  {
    id: 'help-tour-button',
    title: 'Help & Tour',
    body: 'You can restart this tour any time from the help menu.',
    selectors: ['[data-tour-id="help-tour-button"]', '[aria-label*="Help"]'],
    placement: 'left',
  },
];

/**
 * Default tour ID for persistence and analytics
 */
export const DEFAULT_TOUR_ID = 'inkwell-onboarding-v1';

/**
 * Full tour configuration ready to pass to TourService.start()
 */
export const defaultTourConfig = {
  id: DEFAULT_TOUR_ID,
  steps: defaultTourSteps,
  version: 1,
};
