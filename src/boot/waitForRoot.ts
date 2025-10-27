/**
 * Boot utility: Wait for root element to be available before mounting React
 * Prevents "Root element not found" errors
 */

export async function waitForRoot(selector = '#root', timeoutMs = 5000): Promise<HTMLElement> {
  const start = performance.now();

  while (performance.now() - start < timeoutMs) {
    const el = document.querySelector(selector);
    if (el instanceof HTMLElement) {
      return el;
    }
    // Wait for next animation frame before retrying
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }

  throw new Error(`Boot: root selector '${selector}' not found in ${timeoutMs}ms`);
}
