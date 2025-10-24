// Central place for tour IDs and their steps
export type TourId = 'profile-tour' | 'feature-tour' | 'welcome-tour' | 'inkwell-spotlight';

export interface TourStepAction {
  label: string;
  action: 'navigate' | 'click' | 'custom';
  target?: string; // URL for navigate, selector for click
  handler?: () => void; // Custom handler function
}

export interface TourStep {
  id: string;
  title: string;
  description?: string; // Optional for backwards compatibility
  content?: string; // Alternative to description for newer tours
  target?: string; // CSS selector or element ID (optional for center placement)
  selector?: string; // Alternative to target (supports multiple selectors with comma)
  placement: 'top' | 'bottom' | 'left' | 'right' | 'center';
  order?: number; // Optional - will be inferred from array index if not provided
  category?: 'feature-discovery' | 'onboarding' | 'tips';

  // New spotlight tour features
  nextTrigger?: string; // Event or condition to wait for before enabling "Next" button
  delay?: number; // Delay in ms before showing this step (default: 500ms)
  highlightPulse?: boolean; // Add pulsing animation to highlight
  actions?: TourStepAction[]; // Optional action buttons
  skippable?: boolean; // Can this step be skipped? (default: true)
  optional?: boolean; // Is this step optional?
  view?: string; // View/route context for this step
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

// Inkwell Spotlight Tour (cinematic walkthrough)
export const INKWELL_SPOTLIGHT_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Inkwell Studio',
    content:
      "Welcome to your creative home for writing and story design. Let's get you set up to start your first story.",
    placement: 'center',
    selector: '#sidebar, .dashboard-header, [role="navigation"]',
    nextTrigger: 'dashboardView',
    delay: 600,
    category: 'onboarding',
  },
  {
    id: 'storage-safety',
    title: 'A Quick Note About Saving Your Work',
    content:
      'Inkwell saves everything automatically in your browser. Private or Incognito windows erase data when closed. For lasting drafts, use a normal window or enable cloud backup in Settings.',
    placement: 'center',
    delay: 500,
    category: 'onboarding',
    actions: [
      {
        label: 'Open in Normal Window',
        action: 'custom',
        handler: () => {
          window.open(window.location.href, '_blank', 'noopener,noreferrer');
        },
      },
    ],
  },
  {
    id: 'create-project',
    title: 'Create Your First Project',
    content: 'Click New Project, give it a title, and it will appear right here on your dashboard.',
    placement: 'bottom',
    selector:
      'button[data-tour="create-project"], .create-project-btn, [aria-label*="New Project"]',
    nextTrigger: 'onProjectCreated',
    delay: 500,
    highlightPulse: true,
    category: 'onboarding',
  },
  {
    id: 'begin-writing',
    title: 'Begin Writing',
    content:
      'Open your project to enter Writing Mode. You can start your first chapter or scene — everything auto-saves.',
    placement: 'right',
    selector: '.project-card:first-child, [data-tour="first-project"]',
    nextTrigger: 'writingPanelOpen',
    delay: 500,
    highlightPulse: true,
    category: 'onboarding',
  },
  {
    id: 'plan-story',
    title: 'Plan Your Story',
    content:
      'In Story Planning, you can outline your plot, track your characters, and build your world — all in one place.',
    placement: 'right',
    selector: '#nav-story-planning, [data-nav="story-planning"], [href*="story-planning"]',
    nextTrigger: 'storyPlanningOpen',
    delay: 400,
    category: 'feature-discovery',
  },
  {
    id: 'beat-sheet',
    title: 'Build Your Beat Sheet',
    content: 'Add key beats for major story moments to shape your pacing and narrative flow.',
    placement: 'bottom',
    selector: '#tab-beat-sheet, [data-tab="beat-sheet"], [role="tab"][aria-label*="Beat"]',
    nextTrigger: 'beatSheetCompleted',
    delay: 400,
    category: 'feature-discovery',
  },
  {
    id: 'characters',
    title: 'Create Characters',
    content:
      'Here is where your cast comes to life. Add traits, relationships, and arcs for every character.',
    placement: 'bottom',
    selector: '#tab-characters, [data-tab="characters"], [role="tab"][aria-label*="Character"]',
    nextTrigger: 'charactersAdded',
    delay: 400,
    category: 'feature-discovery',
  },
  {
    id: 'world-building',
    title: 'Expand Your World',
    content: 'Document your settings, rules, and references to keep your story world consistent.',
    placement: 'bottom',
    selector: '#tab-world-building, [data-tab="world-building"], [role="tab"][aria-label*="World"]',
    nextTrigger: 'worldBuildingVisited',
    delay: 400,
    category: 'feature-discovery',
  },
  {
    id: 'ai-integration',
    title: 'Connect AI Integration',
    content:
      "To unlock Inkwell's AI-powered tools, go to Settings → AI Integration and paste your Anthropic API key.",
    placement: 'right',
    selector: '#nav-settings, [data-nav="settings"], [href*="settings"]',
    nextTrigger: 'aiIntegrationConfigured',
    delay: 400,
    category: 'feature-discovery',
    actions: [
      {
        label: 'Open Settings',
        action: 'navigate',
        target: '/settings/ai',
      },
    ],
  },
  {
    id: 'timeline',
    title: 'Explore Your Timeline',
    content: 'Visualize your story across time to spot pacing or continuity issues.',
    placement: 'right',
    selector: '#nav-timeline, [data-nav="timeline"], [href*="timeline"]',
    nextTrigger: 'timelineVisited',
    delay: 400,
    category: 'feature-discovery',
  },
  {
    id: 'analytics',
    title: 'View Analytics',
    content:
      'Track your writing progress — daily word counts, streaks, and milestones all appear here.',
    placement: 'right',
    selector: '#nav-analytics, [data-nav="analytics"], [href*="analytics"]',
    nextTrigger: 'analyticsVisited',
    delay: 400,
    category: 'feature-discovery',
  },
  {
    id: 'complete',
    title: "You're Ready to Write",
    content: 'Inkwell is built for focus, imagination, and flow. Welcome home.',
    placement: 'center',
    selector: '.dashboard-home-link, [data-nav="dashboard"], [aria-label*="Dashboard"]',
    delay: 500,
    category: 'onboarding',
    actions: [
      {
        label: 'Start Writing',
        action: 'navigate',
        target: '/current-project',
      },
    ],
  },
];

export const FEATURE_DISCOVERY_STEPS = [
  ...WRITING_PANEL_TOUR,
  ...TIMELINE_PANEL_TOUR,
  ...ANALYTICS_PANEL_TOUR,
  ...DASHBOARD_PANEL_TOUR,
];

export const TOUR_MAP: Record<TourId, TourDefinition> = {
  'inkwell-spotlight': INKWELL_SPOTLIGHT_STEPS,
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
