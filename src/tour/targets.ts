// @ts-nocheck
// File: src/tour/targets.ts
// Robust target resolution with MutationObserver and fallbacks

/**
 * Resolves a target element by trying multiple selectors with retry logic
 * Uses MutationObserver to watch for DOM changes during retry window
 */
export async function resolveTarget(
  selectors: string[],
  { timeout = 6000 }: { timeout?: number } = {},
): Promise<HTMLElement | null> {
  // Try to find the first matching element from the selector list
  const tryFind = () =>
    selectors.map((s) => document.querySelector(s)).find(Boolean) as HTMLElement | null;

  // Check if we already have a match
  const found = tryFind();
  if (found) return found;

  // Set up retry with MutationObserver
  return new Promise<HTMLElement | null>((resolve) => {
    const observer = new MutationObserver(() => {
      const element = tryFind();
      if (element) {
        observer.disconnect();
        resolve(element);
      }
    });

    // Watch for DOM changes
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'data-tour'],
    });

    // Set timeout to avoid hanging
    setTimeout(() => {
      observer.disconnect();
      resolve(tryFind()); // One final try before giving up
    }, timeout);
  });
}

/**
 * Gets the ideal placement for a spotlight based on viewport position
 */
export function getIdealPlacement(
  element: HTMLElement,
  preferredPlacement?: 'top' | 'right' | 'bottom' | 'left',
): 'top' | 'right' | 'bottom' | 'left' {
  if (!element) return preferredPlacement || 'bottom';

  const rect = element.getBoundingClientRect();
  const viewHeight = window.innerHeight;
  const viewWidth = window.innerWidth;

  // If preferred placement works, use it
  if (preferredPlacement) {
    const hasSpace = {
      top: rect.top > 150,
      right: viewWidth - rect.right > 300,
      bottom: viewHeight - rect.bottom > 150,
      left: rect.left > 300,
    };
    if (hasSpace[preferredPlacement]) return preferredPlacement;
  }

  // Otherwise find best fit
  const spaceAvailable = {
    top: rect.top,
    right: viewWidth - rect.right,
    bottom: viewHeight - rect.bottom,
    left: rect.left,
  };

  // Sort by available space and pick the best one
  return Object.entries(spaceAvailable).sort(([, a], [, b]) => b - a)[0][0] as
    | 'top'
    | 'right'
    | 'bottom'
    | 'left';
}

/**
 * Ensures the element is in view with smooth scrolling
 */
export function scrollIntoViewIfNeeded(element: HTMLElement | null) {
  if (!element) return;

  const rect = element.getBoundingClientRect();
  const isInView =
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= window.innerHeight &&
    rect.right <= window.innerWidth;

  if (!isInView) {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
    });
  }
}
