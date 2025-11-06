export interface SpotlightStep {
  id: string;
  target: string;
  content: string;
  fallback?: {
    x: number | 'center';
    y: number | 'center';
  };
}

export const spotlightSteps: SpotlightStep[] = [
  {
    id: 'sidebar-navigation',
    target: '[data-tour="sidebar"]',
    content:
      'Quick access to all your projects and tools. Switch between Dashboard, Writing, Planning, Timeline, Analytics, and Settings.',
    fallback: { x: 48, y: 120 },
  },
  {
    id: 'dashboard-view',
    target: '[data-tour="dashboard-nav"]',
    content: 'View all your writing projects and recent work in one place.',
    fallback: { x: 200, y: 200 },
  },
  {
    id: 'create-project',
    target: '[data-tour="new-project"]',
    content: 'Create a new writing project to start your next story.',
    fallback: { x: 48, y: 'center' as 'center' },
  },
];
