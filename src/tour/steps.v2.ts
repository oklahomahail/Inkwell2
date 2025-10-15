// @ts-nocheck
// File: src/tour/steps.v2.ts
// Enhanced tour step definitions with route awareness

import { to } from '@/lib/router';

import type { TourStep } from './types';

/**
 * Enhanced tour steps with route-awareness and proper targeting
 */
export const DETAILED_TOUR: TourStep[] = [
  {
    id: 'sidebar',
    route: '/',
    selectors: ['[data-tour="sidebar"]', '#main-nav'],
    placement: 'right',
    title: 'Your workspace',
    body: 'Navigate between your Dashboard, Writing, Timeline, and more using the sidebar. Quick access to all your tools.',
  },
  {
    id: 'writing-start',
    route: '/writing',
    selectors: ['[data-tour="start-writing"]', '#new-chapter-btn'],
    beforeNavigate: () => to('/writing'),
    placement: 'bottom',
    title: 'Start writing',
    body: 'Create your first chapter, set writing goals, and enter focus mode for distraction-free writing.',
  },
  {
    id: 'plot-board',
    route: '/plotboards',
    selectors: ['[data-tour="plot-board"]', '#plot-board-tabs'],
    beforeNavigate: () => to('/plotboards'),
    placement: 'top',
    spotlightPadding: 8,
    title: 'Plot Board',
    body: 'Organize your story with drag-and-drop cards. Track plot points, character arcs, and story beats.',
  },
  {
    id: 'ai-insights',
    route: '/plotboards',
    selectors: ['[data-tour="insights-tab"]', '#ai-insights-tab'],
    placement: 'right',
    title: 'AI Insights',
    body: "Get AI-powered analysis of your story's pacing, character arcs, and plot development.",
  },
  {
    id: 'timeline',
    route: '/timeline',
    selectors: ['[data-tour="timeline"]', '#timeline-container'],
    beforeNavigate: () => to('/timeline'),
    placement: 'bottom',
    title: 'Timeline',
    body: "Visualize your story's events chronologically. Spot potential plot holes and maintain consistency.",
  },
  {
    id: 'export',
    route: '/settings',
    selectors: ['[data-tour="export-settings"]', '#export-panel'],
    beforeNavigate: () => to('/settings'),
    placement: 'left',
    title: 'Export',
    body: 'Generate publication-ready manuscripts in multiple formats with smart formatting.',
  },
  {
    id: 'help',
    route: '/settings',
    selectors: ['[data-tour="help-settings"]', '#help-panel'],
    placement: 'left',
    title: 'Help & Resources',
    body: 'Access documentation, tutorials, and support. You can also relaunch this tour anytime.',
  },
];

/**
 * Configuration for v2 detailed tour
 */
export const tourConfig = {
  version: 2,
  steps: DETAILED_TOUR,
  fallbackPlacement: 'bottom' as const,
  defaultSpotlightPadding: 4,
  timeoutMs: 6000,
  analyticsEnabled: true,
};
