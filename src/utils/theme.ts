/**
 * Theme utilities - single source of truth for theme management
 * Matches the inline script in index.html for consistency
 */

const THEME_STORAGE_KEY = 'inkwell-theme';

export type Theme = 'light' | 'dark';

/**
 * Set the theme and persist to localStorage
 * Always toggles only the 'dark' class (light mode = no class)
 */
export function setTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  } catch (error) {
    // localStorage unavailable (private mode)
    console.warn('[Theme] Failed to persist theme:', error);
    // Still apply the class change
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }
}

/**
 * Get the current theme from localStorage or system preference
 */
export function getTheme(): Theme {
  try {
    const persisted = localStorage.getItem(THEME_STORAGE_KEY);
    if (persisted === 'dark' || persisted === 'light') {
      return persisted;
    }
  } catch {
    // localStorage unavailable
  }

  // Fall back to system preference
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }

  return 'light'; // Default to light
}

/**
 * Toggle between light and dark themes
 */
export function toggleTheme(): Theme {
  const current = getTheme();
  const next: Theme = current === 'dark' ? 'light' : 'dark';
  setTheme(next);
  return next;
}

/**
 * Check if dark mode is currently active
 */
export function isDarkMode(): boolean {
  return document.documentElement.classList.contains('dark');
}
