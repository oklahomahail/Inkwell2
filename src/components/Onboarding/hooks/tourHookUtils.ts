// src/components/Onboarding/hooks/tourHookUtils.ts

/**
 * Check if tours are suppressed for the current route
 */
export const isSuppressed = () => !!sessionStorage.getItem('inkwell:tour:suppress');

/**
 * Wait for an element matching the selector to appear in the DOM
 * @param selector CSS selector to match
 * @param timeoutMs Maximum time to wait in milliseconds
 * @returns The found element or null if timeout exceeded
 */
export function waitForAnchor(selector: string, timeoutMs = 3000): Promise<Element | null> {
  return new Promise((resolve) => {
    const start = performance.now();
    function tick() {
      const el = document.querySelector(selector);
      if (el) {
        if (import.meta.env.DEV) {
          devLog.debug('[spotlight] anchor found?', true, { selector });
        }
        return resolve(el);
      }
      if (performance.now() - start > timeoutMs) {
        if (import.meta.env.DEV) {
          devLog.debug('[spotlight] anchor timeout after', timeoutMs, 'ms');
        }
        return resolve(null);
      }
      requestAnimationFrame(tick);
    }
    tick();
  });
}
