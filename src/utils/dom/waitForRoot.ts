/**
 * Resilient root element readiness guard
 * Never lies about DOM availability - uses multiple gates to avoid edge races
 */

export async function waitForRoot(id = 'root'): Promise<HTMLElement> {
  // Quick path: element already exists
  const el = document.getElementById(id);
  if (el) return el;

  // If document is already loaded, give parser a microtask to flush
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    await Promise.resolve(); // microtask to flush parser work
    const late = document.getElementById(id);
    if (late) return late;
  }

  // Wait for DOMContentLoaded if not yet fired
  if (document.readyState === 'loading') {
    await new Promise<void>((r) =>
      document.addEventListener('DOMContentLoaded', () => r(), { once: true }),
    );
  }

  const domLoaded = document.getElementById(id);
  if (domLoaded) return domLoaded;

  // Final RAF tick avoids a rare paint-ordering race
  await new Promise(requestAnimationFrame);
  const rafEl = document.getElementById(id);
  if (!rafEl) {
    throw new Error(`#${id} not present after DOMContentLoaded + RAF`);
  }
  return rafEl;
}

/**
 * Check if root is ready synchronously (for early guards)
 */
export function isRootReady(id = 'root'): boolean {
  return !!document.getElementById(id);
}
