/**
 * Tour anchor readiness check
 * Centralized place to check if all required tour anchors are present
 */

/**
 * Check if all required tour anchors are ready in the DOM
 * @param selectors - Array of CSS selectors that must be present
 * @returns true if all selectors resolve to elements
 */
export function anchorsReady(selectors: string[]): boolean {
  if (!selectors || selectors.length === 0) return true;

  try {
    return selectors.every((selector) => {
      try {
        return !!document.querySelector(selector);
      } catch {
        // Invalid selector
        return false;
      }
    });
  } catch {
    return false;
  }
}

/**
 * Wait for anchors to be ready with timeout
 * Uses RAF for efficient polling
 */
export function waitForAnchors(
  selectors: string[],
  options: { timeout?: number; interval?: number } = {},
): Promise<boolean> {
  const { timeout = 1000, interval = 16 } = options; // ~60fps polling

  return new Promise<boolean>((resolve) => {
    if (anchorsReady(selectors)) {
      resolve(true);
      return;
    }

    const startTime = Date.now();
    let rafId = 0;
    let tries = 0;
    const maxTries = Math.ceil(timeout / interval);

    const check = () => {
      if (anchorsReady(selectors)) {
        resolve(true);
        return;
      }

      if (++tries > maxTries || Date.now() - startTime > timeout) {
        resolve(false);
        return;
      }

      rafId = requestAnimationFrame(check);
    };

    rafId = requestAnimationFrame(check);

    // Cleanup on timeout
    setTimeout(() => {
      if (typeof cancelAnimationFrame !== 'undefined') {
        cancelAnimationFrame(rafId);
      }
      resolve(false);
    }, timeout + 100);
  });
}
