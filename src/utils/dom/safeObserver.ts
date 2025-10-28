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
  target: unknown,
  options: MutationObserverInit,
): boolean {
  // SSR guard
  if (typeof window === 'undefined' || typeof Node === 'undefined') {
    return false;
  }

  // Node check that survives SSR and weird browsers
  const isNode = target instanceof Node;

  if (!isNode) {
    if (!import.meta.env.PROD) {
      // eslint-disable-next-line no-console
      console.debug('[safeObserve] skipped, non-Node:', target);
    }
    return false;
  }

  try {
    observer.observe(target as Node, options);
    return true;
  } catch (_error) {
    if (!import.meta.env.PROD) {
      console.warn('[safeObserve] observe failed:', _error);
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
  } catch {
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

/**
 * Wait for an element to appear in the DOM
 * Returns null if element doesn't appear within timeout
 */
export async function waitForElement(selector: string, timeout = 2000): Promise<Element | null> {
  // SSR guard
  if (typeof window === 'undefined') return null;

  const start = performance.now();
  let el: Element | null = document.querySelector(selector);

  while (!el && performance.now() - start < timeout) {
    await new Promise((r) => requestAnimationFrame(r));
    el = document.querySelector(selector);
  }

  return el;
}

/**
 * Get a safe target for portal/modal observation
 * Falls back to document.body if preferred target doesn't exist
 */
export function getPortalTarget(preferredId?: string): Node | null {
  if (typeof window === 'undefined') return null;

  if (preferredId) {
    const preferred = document.getElementById(preferredId);
    if (preferred) return preferred;
  }

  return document.body || null;
}
