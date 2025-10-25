/**
 * Preload a lazy-loaded module on hover or idle
 * Usage:
 *   onMouseEnter={() => preload(() => import('./HeavyComponent'))}
 */

export function preload<T>(importer: () => Promise<T>): void {
  importer().catch(() => {
    // Silently ignore preload failures
  });
}

/**
 * Preload a module during idle time
 */
export function preloadOnIdle<T>(importer: () => Promise<T>): void {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => preload(importer));
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(() => preload(importer), 1);
  }
}
