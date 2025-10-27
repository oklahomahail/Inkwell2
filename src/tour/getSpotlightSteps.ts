/**
 * Spotlight Tour Steps
 * Defines the onboarding tour steps for new users
 */

import type { SpotlightStep } from './TourTypes';

/**
 * Target resolver type - can be a string selector or a function that returns an element
 */
type Target = string | (() => Element | null);

/**
 * Create a target resolver that tries multiple selectors in order
 * This makes anchors more reliable when elements have varying attributes
 */
const target = (selectors: string[]): Target => {
  return () => {
    for (const s of selectors) {
      try {
        const el = document.querySelector(s);
        if (el) return el as Element;
      } catch {
        // Invalid selector, try next
        continue;
      }
    }
    return null;
  };
};

/**
 * Get the v2 Spotlight Tour steps
 * Updated for auth → dashboard flow with light theme default
 */
export function getSpotlightSteps(): SpotlightStep[] {
  return [
    {
      target: target(['[data-tour-id="topbar"]', 'header[role="banner"]', '#app-topbar', 'header']),
      title: 'Welcome to Inkwell!',
      content:
        'Inkwell helps you write, plan, and analyze your stories. This quick tour will show you the key features.',
      placement: 'bottom',
      disableInteraction: false,
    },
    {
      target: target(['[data-tour-id="sidebar"]', 'aside[role="navigation"]', 'nav.sidebar']),
      title: 'Navigation',
      content:
        'Use the sidebar to navigate between different parts of your project: Dashboard, Writing, Planning, Timeline, Plot Analysis, Analytics, and Settings.',
      placement: 'right',
      disableInteraction: false,
    },
    {
      target: target([
        '[data-tour-id="nav-dashboard"]',
        'a[href="/dashboard"]',
        'nav a:first-child',
      ]),
      title: 'Dashboard',
      content:
        'Your Dashboard shows an overview of all your projects and recent activity. Start here to create or open projects.',
      placement: 'right',
      disableInteraction: false,
    },
    {
      target: target([
        '[data-tour-id="nav-writing"]',
        'a[href="/writing"]',
        '[data-nav="writing"]',
      ]),
      title: 'Writing',
      content:
        'The Writing panel is where you draft your chapters. Use Focus Mode for distraction-free writing.',
      placement: 'right',
      disableInteraction: false,
      beforeShow: async () => {
        // Could navigate to Writing view if needed
        // But for now, just highlight the nav item
      },
    },
    {
      target: target([
        '[data-tour-id="focus-toggle"]',
        'button#focus-toggle',
        '[data-action="toggle-focus"]',
      ]),
      title: 'Focus Mode',
      content:
        'Click here to enter Focus Mode for distraction-free writing. Press F11 or Esc to exit.',
      placement: 'bottom',
      disableInteraction: false,
    },
    {
      target: target([
        '[data-tour-id="nav-plot-analysis"]',
        'a[href="/plot-analysis"]',
        '[data-nav="plot-analysis"]',
      ]),
      title: 'Plot Analysis',
      content:
        "Get AI-powered insights about your story structure, pacing, and character arcs. This is one of Inkwell's most powerful features!",
      placement: 'right',
      disableInteraction: false,
    },
    {
      target: target([
        '[data-tour-id="storage-banner"]',
        '[data-component="storage-banner"]',
        '.storage-alert',
      ]),
      title: 'Storage Alerts',
      content:
        'Inkwell will warn you about storage issues like private mode or low space. Your work is saved locally in your browser.',
      placement: 'bottom',
      disableInteraction: false,
    },
    {
      target: target([
        '[data-tour-id="help-tour-button"]',
        'button[aria-label*="help"]',
        '[data-action="open-shortcuts"]',
      ]),
      title: 'Keyboard Shortcuts & Help',
      content:
        'Click here anytime to see keyboard shortcuts and get help. You can also restart this tour from Settings.',
      placement: 'bottom',
      disableInteraction: false,
    },
    {
      target: target(['[data-tour-id="topbar"]', 'header[role="banner"]', '#app-topbar', 'header']),
      title: "You're all set!",
      content:
        "That's the quick tour! Start by creating a new project from your Dashboard. Happy writing!",
      placement: 'bottom',
      disableInteraction: false,
    },
  ];
}

/**
 * Filter steps to only include those whose targets exist in the DOM
 */
export function getAvailableSteps(steps: SpotlightStep[]): SpotlightStep[] {
  return steps.filter((step) => {
    try {
      // If target is a function, call it to resolve the element
      if (typeof step.target === 'function') {
        return step.target() !== null;
      }
      // Otherwise treat as string selector
      return document.querySelector(step.target as string) !== null;
    } catch {
      return false;
    }
  });
}
