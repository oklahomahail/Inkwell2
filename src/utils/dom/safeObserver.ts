/**
 * Enhanced safe wrapper for MutationObserver.observe()
 * Prevents crashes from invalid targets with retry mechanism
 * Prevents: "Failed to execute 'observe' on 'MutationObserver': parameter 1 is not of type 'Node'"
 */

export function safeObserve(
  observer: MutationObserver,
  target: Element | null,
  opts: MutationObserverInit,
): boolean {
  if (!target || !(target instanceof Node)) {
    return false;
  }

  try {
    observer.observe(target, opts);
    return true;
  } catch (error) {
    if (!import.meta.env.PROD) {
      console.warn('[safeObserve] Failed to observe target:', error);
    }
    return false;
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
