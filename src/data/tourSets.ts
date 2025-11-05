// src/data/tourSets.ts
/**
 * Tour Sets - Modular Contextual Help System
 *
 * Each tour set is a small, focused mini-tour (3-4 steps max) tied to a specific
 * view or feature. Tours use selector-based anchors with graceful fallback for
 * missing DOM elements.
 *
 * Architecture:
 * - Selector-based: Uses data-tour attributes or CSS selectors
 * - Runtime validation: Only shows steps for visible elements
 * - Modular: Each tour is independent and context-specific
 * - Completion tracking: Uses localStorage to track completed tours
 */

export interface TourStep {
  id: string;
  selector: string;
  title: string;
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

export interface TourSet {
  id: string;
  name: string;
  description: string;
  steps: TourStep[];
}

/**
 * Tour Sets Registry
 *
 * Add new tours here as features are added. Each tour should be:
 * - Short (3-4 steps max)
 * - Context-specific (tied to a single view or feature)
 * - Self-contained (can run independently)
 */
export const TOUR_SETS: Record<string, TourSet> = {
  /**
   * Getting Started Tour
   * Context: Dashboard view (first-time users)
   */
  gettingStarted: {
    id: 'gettingStarted',
    name: 'Getting Started',
    description: 'Learn the basics of Inkwell',
    steps: [
      {
        id: 'sidebar',
        selector: "[data-tour='sidebar']",
        title: 'Sidebar Navigation',
        content:
          'This is your main navigation bar. Use it to switch between Dashboard, Writing, World, and AI Assistant.',
        placement: 'right',
      },
      {
        id: 'create-project',
        selector: "[data-tour='create-project']",
        title: 'Create Your First Project',
        content:
          'Click here to create a new writing project. Each project can contain multiple chapters, characters, and notes.',
        placement: 'bottom',
      },
      {
        id: 'project-list',
        selector: "[data-tour='project-list']",
        title: 'Your Projects',
        content:
          'All your projects appear here. Click on any project to open it and start writing.',
        placement: 'top',
      },
    ],
  },

  /**
   * Chapter Manager Tour
   * Context: Writing panel with chapter tabs visible
   */
  chapterManager: {
    id: 'chapterManager',
    name: 'Chapter Management',
    description: 'Learn how to manage chapters',
    steps: [
      {
        id: 'chapter-tabs',
        selector: "[data-tour='chapter-tabs']",
        title: 'Chapter Tabs',
        content:
          'Use the new tab bar to create, reorder, and navigate between chapters. Your changes sync automatically.',
        placement: 'bottom',
      },
      {
        id: 'chapter-nav',
        selector: "[data-tour='chapter-nav']",
        title: 'Quick Navigation',
        content:
          'Use the arrow buttons to quickly move between chapters, or click the + button to create a new one.',
        placement: 'bottom',
      },
      {
        id: 'realtime-status',
        selector: "[data-tour='realtime-status']",
        title: 'Real-Time Sync',
        content:
          'This indicator shows your sync status. Green = Live sync active. Gray = Working offline. Click Sync to manually save to cloud.',
        placement: 'left',
      },
      {
        id: 'editor',
        selector: "[data-tour='editor']",
        title: 'Your Writing Space',
        content:
          'Start typing to write your chapter. Changes are saved automatically every 600ms and synced to the cloud.',
        placement: 'top',
      },
    ],
  },

  /**
   * AI Assistant Tour
   * Context: AI Assistant panel visible
   */
  aiAssistant: {
    id: 'aiAssistant',
    name: 'AI Assistant',
    description: 'Learn how to use the AI writing assistant',
    steps: [
      {
        id: 'ai-input',
        selector: "[data-tour='ai-input']",
        title: 'Ask Claude',
        content:
          'Type your question or request here. Claude can help with character development, plot ideas, worldbuilding, and more.',
        placement: 'top',
      },
      {
        id: 'ai-history',
        selector: "[data-tour='ai-history']",
        title: 'Conversation History',
        content:
          'Your conversation with Claude is saved here. Scroll up to review previous responses.',
        placement: 'left',
      },
      {
        id: 'ai-context',
        selector: "[data-tour='ai-context']",
        title: 'Context Awareness',
        content:
          'Claude has access to your current project, including chapters and world details, for more relevant suggestions.',
        placement: 'top',
      },
    ],
  },

  /**
   * World Builder Tour
   * Context: World panel visible
   */
  worldBuilder: {
    id: 'worldBuilder',
    name: 'World Builder',
    description: 'Learn how to organize your story world',
    steps: [
      {
        id: 'world-tabs',
        selector: "[data-tour='world-tabs']",
        title: 'World Categories',
        content:
          'Switch between Characters, Locations, Items, and Notes. Each category helps you organize different aspects of your world.',
        placement: 'bottom',
      },
      {
        id: 'world-create',
        selector: "[data-tour='world-create']",
        title: 'Create Entries',
        content:
          'Click here to add new characters, locations, or items. Each entry can include descriptions, relationships, and custom notes.',
        placement: 'left',
      },
      {
        id: 'world-search',
        selector: "[data-tour='world-search']",
        title: 'Quick Search',
        content: 'Use search to quickly find any character, location, or item in your world.',
        placement: 'bottom',
      },
    ],
  },

  /**
   * Autosave Tour
   * Context: Any writing view (shows after first edit)
   */
  autosave: {
    id: 'autosave',
    name: 'Autosave System',
    description: 'Understand how your work is saved',
    steps: [
      {
        id: 'autosave-indicator',
        selector: "[data-tour='autosave-indicator']",
        title: 'Autosave Status',
        content:
          'This indicator shows when your work is being saved. "Saved" = All changes synced. "Saving..." = Upload in progress.',
        placement: 'left',
      },
      {
        id: 'offline-mode',
        selector: "[data-tour='offline-mode']",
        title: 'Offline Support',
        content:
          'Inkwell works offline! Your changes are saved locally and will sync automatically when you reconnect.',
        placement: 'left',
      },
    ],
  },
};

/**
 * Get a tour set by ID
 */
export function getTourSet(id: string): TourSet | null {
  return TOUR_SETS[id] || null;
}

/**
 * Get all available tour sets
 */
export function getAllTourSets(): TourSet[] {
  return Object.values(TOUR_SETS);
}

/**
 * Check if a tour has been completed
 */
export function isTourCompleted(tourId: string): boolean {
  const completed = localStorage.getItem(`tour-completed-${tourId}`);
  return completed === 'true';
}

/**
 * Mark a tour as completed
 */
export function markTourCompleted(tourId: string): void {
  localStorage.setItem(`tour-completed-${tourId}`, 'true');
}

/**
 * Reset a tour (for testing or user request)
 */
export function resetTour(tourId: string): void {
  localStorage.removeItem(`tour-completed-${tourId}`);
}

/**
 * Reset all tours
 */
export function resetAllTours(): void {
  getAllTourSets().forEach((tour) => resetTour(tour.id));
}
