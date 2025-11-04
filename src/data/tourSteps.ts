/**
 * Tour Steps - Centralized tour configuration
 *
 * Defines all tour steps for Inkwell's guided onboarding experience.
 */

export interface TourStep {
  id: string;
  selector: string;
  title: string;
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

/**
 * Default onboarding tour steps
 * Guides users through Inkwell's core features
 */
export const defaultTourSteps: TourStep[] = [
  {
    id: 'welcome',
    selector: '[data-tour="dashboard"]',
    title: 'Welcome to Inkwell',
    content:
      "Your professional writing companion. Let's take a quick tour of the essential features.",
    placement: 'bottom',
  },
  {
    id: 'sidebar',
    selector: '[data-tour="sidebar"]',
    title: 'Navigation Sidebar',
    content: 'Switch between Dashboard, Writing, Timeline, and Analytics views.',
    placement: 'right',
  },
  {
    id: 'projects',
    selector: '[data-tour="projects"]',
    title: 'Your Projects',
    content:
      'Create and manage multiple writing projects. Each project can have chapters, scenes, and characters.',
    placement: 'bottom',
  },
  {
    id: 'new-project',
    selector: '[data-tour="new-project"]',
    title: 'Create New Project',
    content: 'Click here to start a new project from scratch or use a template.',
    placement: 'bottom',
  },
  {
    id: 'writing-view',
    selector: '[data-tour="writing-nav"]',
    title: 'Writing View',
    content:
      "Access the distraction-free writing editor where you'll spend most of your time crafting your story.",
    placement: 'right',
  },
  {
    id: 'timeline',
    selector: '[data-tour="timeline-nav"]',
    title: 'Timeline & Planning',
    content: 'Plan your story structure, manage plot points, and visualize your narrative arc.',
    placement: 'right',
  },
  {
    id: 'analytics',
    selector: '[data-tour="analytics-nav"]',
    title: 'Writing Analytics',
    content: 'Track your progress with word count, writing sessions, and productivity insights.',
    placement: 'right',
  },
  {
    id: 'settings',
    selector: '[data-tour="settings"]',
    title: 'Settings',
    content: 'Configure your writing environment, AI assistant, and preferences.',
    placement: 'left',
  },
  {
    id: 'ai-assistant',
    selector: '[data-tour="settings"]',
    title: 'AI Writing Assistant',
    content:
      "Configure Claude AI to help with writer's block, generate ideas, and improve your prose. Go to Settings → AI to set up your API key.",
    placement: 'left',
  },
  {
    id: 'export-options',
    selector: '[data-tour="dashboard"]',
    title: 'Export Your Work',
    content:
      'Export your finished work to PDF, DOCX, or Markdown formats. Perfect for sharing with beta readers or publishers.',
    placement: 'bottom',
  },
  {
    id: 'keyboard-shortcuts',
    selector: '[data-tour="dashboard"]',
    title: 'Keyboard Shortcuts',
    content:
      'Speed up your workflow with shortcuts: ⌘K for command palette, ⌘1-5 for quick view switching, and ⌘S to save.',
    placement: 'bottom',
  },
  {
    id: 'offline-mode',
    selector: '[data-tour="dashboard"]',
    title: 'Offline-First',
    content:
      'Inkwell works completely offline. Your data is stored locally in your browser, so you can write anywhere, anytime.',
    placement: 'bottom',
  },
  {
    id: 'complete',
    selector: '[data-tour="dashboard"]',
    title: "You're Ready!",
    content:
      "That's it! You can restart this tour anytime from Settings → Help. Happy writing! 📝✨",
    placement: 'bottom',
  },
];
