// File: src/components/Onboarding/selectorMap.ts
// Map of selectors for the onboarding components

import { safeObserve } from '@/utils/dom/safeObserver';

export const SPOTLIGHT_SELECTORS = {
  // Sidebar sections
  SIDEBAR: '#sidebar',
  PROJECTS_SECTION: '#sidebar-projects-section',
  WORKSPACE_SECTION: '#sidebar-workspace-section',
  NEW_PROJECT_BUTTON: '#new-project-button',

  // Dashboard elements
  DASHBOARD_HEADER: '#dashboard-header',
  RECENT_PROJECTS: '#recent-projects-section',
  CREATE_PROJECT_CARD: '#create-project-card',

  // Workflow components
  EDITOR: '#inkwell-editor',
  EDITOR_TOOLBAR: '.editor-toolbar',
  FORMATTING_TOOLS: '.formatting-tools',
  AI_TOOLS: '#ai-tools-section',
  CHARACTER_PANEL: '#character-panel',
  PLOT_PANEL: '#plot-panel',
  SETTINGS_PANEL: '#settings-panel',

  // Navigation
  TOP_NAV: '#top-navigation',
  USER_MENU: '#user-menu',
  BREADCRUMBS: '#breadcrumbs',

  // Modals and overlays
  HELP_CENTER: '#help-center-button',
  COMMAND_PALETTE: '#command-palette-button',
};

// Map sidebar items to their selectors
export const SIDEBAR_ITEMS = {
  PROJECTS: '#sidebar-projects',
  RECENT: '#sidebar-recent',
  CHARACTERS: '#sidebar-characters',
  PLOTS: '#sidebar-plots',
  SETTINGS: '#sidebar-settings',
  HELP: '#sidebar-help',
};

// Map dashboard card selectors
export const DASHBOARD_CARDS = {
  PROJECTS: '#dashboard-projects-card',
  RECENT: '#dashboard-recent-card',
  QUICK_START: '#dashboard-quick-start',
  TUTORIALS: '#dashboard-tutorials',
};

// Onboarding tour step target selectors
export const TOUR_TARGETS = {
  WELCOME: '#welcome-tour-target',
  SIDEBAR: '#sidebar-tour-target',
  PROJECTS: '#projects-tour-target',
  EDITOR: '#editor-tour-target',
  AI_TOOLS: '#ai-tools-tour-target',
  CHARACTER_PANEL: '#character-panel-tour-target',
  PLOT_PANEL: '#plot-panel-tour-target',
  COMMAND_PALETTE: '#command-palette-tour-target',
  HELP_CENTER: '#help-center-tour-target',
};

// Export all selector maps
export const selectorMaps = {
  spotlight: SPOTLIGHT_SELECTORS,
  sidebar: SIDEBAR_ITEMS,
  dashboard: DASHBOARD_CARDS,
  tour: TOUR_TARGETS,
};

/**
 * Helper function to resolve the first existing target from a list of selectors
 * @param selectors - Array of CSS selector strings
 * @returns HTMLElement | null
 */
export function resolveTarget(selectors: readonly string[]): HTMLElement | null {
  // SSR guard
  if (typeof window === 'undefined') return null;
  if (!document) return null;

  // Try each selector in order until we find one that exists
  for (const selector of selectors) {
    try {
      const el = document.querySelector(selector) as HTMLElement;
      if (el) return el;
    } catch (error) {
      console.warn(`Invalid selector: ${selector}`, error);
    }
  }
  return null;
}

/**
 * Wait for any of the target selectors to appear in the DOM
 * Uses MutationObserver to detect DOM changes
 * @param selectors - Array of CSS selector strings
 * @param timeout - Maximum wait time in ms (default: 3000)
 * @returns Promise<HTMLElement | null>
 */
export function waitForTarget(
  selectors: readonly string[],
  timeout = 3000,
): Promise<HTMLElement | null> {
  // SSR guard
  if (typeof window === 'undefined') return Promise.resolve(null);

  return new Promise((resolve) => {
    // Check immediately first
    const immediate = resolveTarget(selectors);
    if (immediate) {
      resolve(immediate);
      return;
    }

    // Guard against missing document.body (e.g. during auth flows or SSR)
    if (!document || !document.body) {
      console.warn('waitForTarget: document.body is not available');
      setTimeout(() => resolve(null), 0);
      return;
    }

    const node = document.body;
    if (!node || !(node instanceof Node)) {
      console.warn('waitForTarget: document.body is not a Node');
      setTimeout(() => resolve(null), 100); // Fallback to simple timeout
      return;
    }

    let observer: MutationObserver | null = null;

    // Create timeout fallback first so we can reference it in the observer
    const timeoutId = setTimeout(() => {
      if (observer) observer.disconnect();
      resolve(null);
    }, timeout);

    // Set up observer after we know we have a valid node
    try {
      observer = new MutationObserver(() => {
        const el = resolveTarget(selectors);
        if (el) {
          if (observer) observer.disconnect();
          clearTimeout(timeoutId);
          resolve(el);
        }
      });

      // Use safeObserve utility to prevent crashes
      const observed = safeObserve(observer, node, {
        childList: true,
        subtree: true,
      });

      if (!observed) {
        setTimeout(() => resolve(null), 100); // Fallback
        return;
      }
    } catch (error) {
      console.warn('MutationObserver failed:', error);
      setTimeout(() => resolve(null), 100); // Try one more time
    }
  });
}
