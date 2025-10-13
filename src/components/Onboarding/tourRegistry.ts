// Central place for tour IDs and their steps
export type TourId = 'profile-tour' | 'feature-tour' | 'welcome-tour';

export interface TourStep {
  id: string;
  title: string;
  description: string;
  target: string; // CSS selector or element ID
  placement: 'top' | 'bottom' | 'left' | 'right' | 'center';
  order: number;
  category: 'feature-discovery' | 'onboarding' | 'tips';
}

export type TourDefinition = TourStep[];

// Core tour steps for different panels
export const CORE_TOUR_STEPS: TourStep[] = [
  {
    id: 'core-1',
    title: 'Welcome to Inkwell',
    description: 'Get started with core features and navigation.',
    target: '#main-nav',
    placement: 'bottom',
    order: 1,
    category: 'onboarding',
  },
];

export const WRITING_PANEL_TOUR: TourStep[] = [
  {
    id: 'writing-1',
    title: 'Writing Panel',
    description: 'This is where you write and edit your content.',
    target: '#writing-panel',
    placement: 'bottom',
    order: 1,
    category: 'feature-discovery',
  },
];

export const TIMELINE_PANEL_TOUR: TourStep[] = [
  {
    id: 'timeline-1',
    title: 'Timeline Panel',
    description: 'Plan and organize your story timeline here.',
    target: '#timeline-panel',
    placement: 'bottom',
    order: 1,
    category: 'feature-discovery',
  },
];

export const ANALYTICS_PANEL_TOUR: TourStep[] = [
  {
    id: 'analytics-1',
    title: 'Analytics Panel',
    description: 'Track your writing progress and insights.',
    target: '#analytics-panel',
    placement: 'bottom',
    order: 1,
    category: 'feature-discovery',
  },
];

export const DASHBOARD_PANEL_TOUR: TourStep[] = [
  {
    id: 'dashboard-1',
    title: 'Dashboard Panel',
    description: 'Get an overview of your writing projects.',
    target: '#dashboard-panel',
    placement: 'bottom',
    order: 1,
    category: 'feature-discovery',
  },
];

export const ONBOARDING_STEPS = CORE_TOUR_STEPS;

export const FEATURE_DISCOVERY_STEPS = [
  ...WRITING_PANEL_TOUR,
  ...TIMELINE_PANEL_TOUR,
  ...ANALYTICS_PANEL_TOUR,
  ...DASHBOARD_PANEL_TOUR,
];

export const TOUR_MAP: Record<TourId, TourDefinition> = {
  'profile-tour': [
    {
      id: 'profile-start',
      title: 'Profiles',
      description: 'Create and switch writing profiles here.',
      target: '#profile-menu',
      placement: 'bottom',
      order: 1,
      category: 'onboarding',
    },
  ],
  'feature-tour': [
    {
      id: 'feature-start',
      title: 'Key Features',
      description: 'Highlights of writing, timeline, planning, and analytics.',
      target: '#app-header',
      placement: 'bottom',
      order: 1,
      category: 'feature-discovery',
    },
  ],
  'welcome-tour': [
    {
      id: 'welcome-start',
      title: 'Welcome to Inkwell',
      description: 'A quick orientation to get you writing fast.',
      target: '#main',
      placement: 'bottom',
      order: 1,
      category: 'onboarding',
    },
  ],
};
