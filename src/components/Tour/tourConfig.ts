export interface TourStep {
  target: string;
  content: string;
}

export const tourConfig: TourStep[] = [
  {
    target: '[data-spotlight-id="dashboard.welcome"]',
    content:
      'Welcome to Inkwell — your creative workspace where writing, planning, and analysis all flow together.',
  },
  {
    target: '[data-spotlight-id="sidebar.newProject"]',
    content:
      'This button creates a new project. You can manage multiple writing projects, each with its own chapters, notes, and analytics.',
  },
  {
    target: '[data-spotlight-id="topbar.commandPalette"]',
    content:
      'Press ⌘K anytime to open the command palette. It lets you jump between sections, trigger actions, and search instantly.',
  },
  {
    target: '[data-spotlight-id="writing.editor"]',
    content:
      'Here’s your main writing space. Everything auto-saves locally and syncs to the cloud when connected. Use AI assistance from the right panel when needed.',
  },
  {
    target: '[data-spotlight-id="settings.tour"]',
    content:
      'You can replay this tour or customize your experience under Settings. That’s it — you’re ready to start writing!',
  },
];
