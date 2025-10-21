/**
 * Safe wrapper for MutationObserver.observe() that prevents crashes from invalid targets
 * Prevents the common error: "Failed to execute 'observe' on 'MutationObserver': parameter 1 is not of type 'Node'"
 */
export function safeObserve(
  target: unknown,
  obs: MutationObserver,
  options: MutationObserverInit,
): boolean {
  // SSR guard
  if (typeof window === 'undefined') return false;

  // Type guard - blocks null, undefined, window object, numbers, etc.
  if (!target || !(target instanceof Node)) {
    console.warn('[MO] Invalid observe target (not a DOM Node):', target);
    return false;
  }

  try {
    obs.observe(target, options);
    return true;
  } catch (e) {
    console.warn('[MO] Error observing target:', target, e);
    return false;
  }
}
