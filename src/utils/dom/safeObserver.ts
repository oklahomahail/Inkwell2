/**
 * One safe Observer API everywhere - prevents "not a Node" errors forever
 * Routes all observers through one guard to banish crashes
 */

/**
 * Safe wrapper for MutationObserver.observe()
 * Prevents crashes from invalid targets (null, undefined, or non-Node)
 * @returns true if observation started successfully, false otherwise
 */
export function safeObserve(
  observer: MutationObserver,
  target: Node | null | undefined,
  options: MutationObserverInit,
): boolean {
  if (!target || !(target instanceof Node)) {
    return false;
  }

  try {
    observer.observe(target, options);
    return true;
  } catch (error) {
    if (!import.meta.env.PROD) {
      console.warn('[safeObserve] Failed to observe target:', error);
    }
    return false;
  }
}

/**
 * Safe disconnect for observers
 * Never throws, even if observer is null/undefined
 */
export function safeDisconnect(observer: MutationObserver | null | undefined): void {
  try {
    observer?.disconnect();
  } catch (error) {
    // Silently ignore disconnect errors
  }
}

/**
 * Safe observer with automatic retry on next animation frame
 * Useful when DOM elements may not be ready immediately
 */
export function safeObserveWithRetry(
  observer: MutationObserver,
  selector: string,
  opts: MutationObserverInit,
): boolean {
  const target = document.querySelector(selector);
  const ok = safeObserve(observer, target, opts);

  if (!ok) {
    // Retry after next frame if initial attempt fails
    requestAnimationFrame(() => {
      const retryTarget = document.querySelector(selector);
      safeObserve(observer, retryTarget, opts);
    });
  }

  return ok;
}
