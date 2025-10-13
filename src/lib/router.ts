// src/lib/router.ts
// Basic navigation utilities

/**
 * Navigate to a specific route
 * @param path Route path to navigate to
 */
export const to = (path: string): void => {
  // For now, just use window.location
  // In the future, this could be hooked up to a proper router
  window.location.pathname = path;
};

/**
 * Get the current route
 */
export const getCurrentRoute = (): string => {
  return window.location.pathname;
};

/**
 * Check if we're on a specific route
 * @param path Route path to check
 */
export const isRoute = (path: string): boolean => {
  return window.location.pathname === path;
};
