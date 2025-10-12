export interface SpotlightStep {
  id: string;
  target: string;
  content: string;
  fallback?: {
    x: number | 'center';
    y: number;
  };
}

export const spotlightSteps: SpotlightStep[] = [
  {
    id: 'open-search',
    target: '[data-spot="enhanced-search"], #enhanced-search, .js-enhanced-search',
    content: 'Type to search everything.',
    fallback: { x: 'center', y: 96 },
  },
  {
    id: 'sidebar-navigation',
    target: '[data-tour="spotlight-nav"], .nav-primary',
    content: 'Quick access to all your projects and tools.',
    fallback: { x: 48, y: 120 },
  },
  {
    id: 'editor-toolbar',
    target: '[data-tour="editor-tools"], .editor-toolbar',
    content: 'Format and enhance your writing.',
    fallback: { x: 'center', y: 48 },
  },
];
