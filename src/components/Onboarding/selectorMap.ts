/**
 * Centralized Selector Map for Inkwell Spotlight Tour
 *
 * Provides multiple fallback selectors for each tour target.
 * Resolves the first present element in the DOM.
 *
 * Usage:
 *   const element = resolveTarget(SEL.CREATE_PROJECT);
 *   if (element) {
 *     // Found! Show tour step
 *   }
 */

export const SEL = {
  // Dashboard & navigation
  DASHBOARD_HEADER: [
    '.dashboard-header',
    '#sidebar',
    '[data-role="dashboard-header"]',
    'nav[role="navigation"]',
  ],

  // Project creation
  CREATE_PROJECT: [
    '#create-project',
    'button#create-project',
    '[data-action="new-project"]',
    'button[data-tour="create-project"]',
    '.create-project-btn',
    '[aria-label*="New Project"]',
  ],

  // Project cards
  PROJECT_CARD: [
    '.project-card',
    '[data-type="project-card"]',
    '[data-testid="project-card"]',
    '.dashboard-project-item',
  ],

  // Writing panel
  WRITING_PANEL: [
    '#writing-panel',
    '[data-panel="writing"]',
    '.writing-editor',
    '[data-tour="writing-panel"]',
  ],

  // Story planning navigation
  NAV_STORY_PLANNING: [
    '#nav-story-planning',
    '[data-nav="planning"]',
    'a[href*="planning"]',
    '[aria-label*="Story Planning"]',
  ],

  // Beat sheet tab
  TAB_BEAT_SHEET: [
    '#tab-beat-sheet',
    '[data-tab="beats"]',
    '[data-tour="beat-sheet"]',
    'button[aria-label*="Beat Sheet"]',
  ],

  // Characters tab
  TAB_CHARACTERS: [
    '#tab-characters',
    '[data-tab="characters"]',
    '[data-tour="characters"]',
    'button[aria-label*="Characters"]',
  ],

  // World building tab
  TAB_WORLD: [
    '#tab-world-building',
    '[data-tab="world"]',
    '[data-tour="world-building"]',
    'button[aria-label*="World Building"]',
  ],

  // Settings navigation
  NAV_SETTINGS: [
    '#nav-settings',
    '[data-nav="settings"]',
    'a[href*="settings"]',
    '[aria-label*="Settings"]',
  ],

  // Timeline navigation
  NAV_TIMELINE: [
    '#nav-timeline',
    '[data-nav="timeline"]',
    'a[href*="timeline"]',
    '[aria-label*="Timeline"]',
  ],

  // Analytics navigation
  NAV_ANALYTICS: [
    '#nav-analytics',
    '[data-nav="analytics"]',
    'a[href*="analytics"]',
    '[aria-label*="Analytics"]',
  ],

  // Dashboard home link (for completion step)
  DASHBOARD_HOME: [
    '.dashboard-home-link',
    '[data-nav="dashboard"]',
    '[aria-label*="Dashboard"]',
    'a[href="/"]',
  ],
} as const;

/**
 * Resolves the first present element from a list of selectors
 *
 * @param selectors - Array of CSS selector strings
 * @returns First matching HTMLElement or null
 */
export function resolveTarget(selectors: readonly string[]): HTMLElement | null {
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el instanceof HTMLElement) {
      return el;
    }
  }
  return null;
}

/**
 * Resolves a tour target by name with built-in logging
 *
 * @param targetName - Key from SEL map
 * @returns HTMLElement or null
 */
export function resolveTourTarget(targetName: keyof typeof SEL): HTMLElement | null {
  const selectors = SEL[targetName];
  const element = resolveTarget(selectors);

  if (import.meta.env.DEV && !element) {
    console.warn(`[tour] Could not resolve target "${targetName}". Tried selectors:`, selectors);
  }

  return element;
}

/**
 * Waits for a selector to appear in the DOM (useful for async route changes)
 *
 * @param selectors - Array of CSS selector strings
 * @param timeout - Maximum wait time in ms (default: 3000)
 * @returns Promise<HTMLElement | null>
 */
export function waitForTarget(
  selectors: readonly string[],
  timeout = 3000,
): Promise<HTMLElement | null> {
  return new Promise((resolve) => {
    // Check immediately first
    const immediate = resolveTarget(selectors);
    if (immediate) {
      resolve(immediate);
      return;
    }

    // Guard against missing document.body (e.g. during auth flows or SSR)
    if (!document || !document.body) {
      console.warn('resolveSelector: document.body is not available');
      setTimeout(() => resolve(null), 0);
      return;
    }

    // Set up observer
    const observer = new MutationObserver(() => {
      const el = resolveTarget(selectors);
      if (el) {
        observer.disconnect();
        clearTimeout(timer);
        resolve(el);
      }
    });

    // Watch for DOM changes - with guard for safety
    const node = document.body;
    if (!node || !(node instanceof Node)) {
      console.warn('resolveSelector: document.body is not a Node');
      setTimeout(() => resolve(resolveTarget(selectors)), 100); // Fallback to simple timeout
      return;
    }

    try {
      observer.observe(node, {
        childList: true,
        subtree: true,
      });
    } catch (error) {
      console.warn('MutationObserver failed:', error);
      setTimeout(() => resolve(resolveTarget(selectors)), 100); // Try one more time
      return;
    }

    // Timeout fallback
    const timer = setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeout);
  });
}
