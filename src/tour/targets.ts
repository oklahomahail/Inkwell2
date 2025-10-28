// @ts-nocheck
// File: src/tour/targets.ts
// Robust target resolution with MutationObserver and fallbacks

import { safeObserve } from '../utils/dom/safeObserver';

import { TourPlacement } from './types';

/**
 * Resolves a target element by trying multiple selectors with retry logic
 * Uses MutationObserver to watch for DOM changes during retry window
 */
export async function resolveTarget(
  selectors: string[],
  { timeout = 6000 }: { timeout?: number } = {},
): Promise<HTMLElement | null> {
  // SSR guard
  if (typeof window === 'undefined') return null;

  // Try to find the first matching element from the selector list
  const tryFind = () =>
    selectors.map((s) => document.querySelector(s)).find(Boolean) as HTMLElement | null;

  // Check if we already have a match
  const found = tryFind();
  if (found) return found;

  // Guard against missing document.body (e.g. during auth flows or SSR)
  if (!document || !document.body) {
    console.warn('resolveTarget: document.body is not available');
    return null;
  }

  // Set up retry with MutationObserver
  return new Promise<HTMLElement | null>((resolve) => {
    // Watch for DOM changes using safer approach
    const node = document.body;

    // Create observer using the safer pattern
    let observer: MutationObserver | null = null;
    try {
      observer = new MutationObserver(() => {
        const element = tryFind();
        if (element) {
          if (observer) observer.disconnect();
          resolve(element);
        }
      });

      // Use safeObserve utility to prevent crashes
      const observed = safeObserve(observer, node, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style', 'data-tour'],
      });

      if (!observed) {
        // If observation fails, use timeout fallback
        setTimeout(() => resolve(tryFind()), 100);
        return;
      }
    } catch (e) {
      console.warn('MutationObserver failed:', e);
      setTimeout(() => resolve(tryFind()), 100); // Fallback to simple timeout
    }

    // Set timeout to avoid hanging
    setTimeout(() => {
      if (observer) observer.disconnect();
      resolve(tryFind()); // One final try before giving up
    }, timeout);
  });
}

/**
 * Augment target finding with MutationObserver to handle DOM changes
 */
export function findTargetWithRetry(
  selector: string,
  options: {
    timeout?: number;
    rootNode?: Document | Element | null;
    retries?: number;
  } = {},
): Promise<Element | null> {
  // SSR guard
  if (typeof window === 'undefined') return Promise.resolve(null);

  const { timeout = 2000, rootNode = document, _retries = 3 } = options;

  // Find element without retry first
  const tryFind = () => {
    try {
      return rootNode?.querySelector(selector) ?? null;
    } catch (e) {
      console.warn(`Invalid selector: ${selector}`, e);
      return null;
    }
  };

  // Find element directly first
  const element = tryFind();
  if (element) return Promise.resolve(element);

  return new Promise((resolve) => {
    // Set up retry with MutationObserver
    const startTime = Date.now();
    const _checkTimeout = () => Date.now() - startTime > timeout;

    // Get the node to observe (default to document.body)
    const node = rootNode instanceof Document ? rootNode.body : rootNode;

    // Guard: if node is null (e.g., document.body not ready), use timeout fallback
    if (!node) {
      console.warn('findTargetWithRetry: rootNode.body is not available, using timeout fallback');
      setTimeout(() => resolve(tryFind()), 100);
      return;
    }

    // Create observer and use our safe observe utility
    let observer: MutationObserver | null = null;
    try {
      observer = new MutationObserver(() => {
        const element = tryFind();
        if (element) {
          if (observer) observer.disconnect();
          resolve(element);
        }
      });

      // Use safeObserve utility to prevent crashes
      const observed = safeObserve(observer, node, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style', 'data-tour'],
      });

      if (!observed) {
        // If observation fails, use timeout fallback
        setTimeout(() => resolve(tryFind()), 100);
        return;
      }
    } catch (e) {
      console.warn('MutationObserver failed:', e);
      setTimeout(() => resolve(tryFind()), 100); // Fallback to simple timeout
    }

    // Set timeout to avoid hanging
    setTimeout(() => {
      if (observer) observer.disconnect();
      resolve(tryFind()); // One final try before giving up
    }, timeout);
  });
}

/**
 * Heuristic to choose a placement that fits in the viewport.
 * - Tries the provided `preferred` first, then falls back to the side with the most space.
 */
export function getIdealPlacement(
  anchor: Element | null | undefined,
  preferred: TourPlacement = 'bottom',
  margin = 16,
): TourPlacement {
  if (!anchor || typeof window === 'undefined') return preferred;

  const rect = anchor.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const spaceTop = rect.top - margin;
  const spaceBottom = vh - rect.bottom - margin;
  const spaceLeft = rect.left - margin;
  const spaceRight = vw - rect.right - margin;

  const fits = (p: TourPlacement) => {
    switch (p) {
      case 'top':
        return spaceTop > rect.height / 2 || spaceTop > 120;
      case 'bottom':
        return spaceBottom > rect.height / 2 || spaceBottom > 120;
      case 'left':
        return spaceLeft > rect.width / 2 || spaceLeft > 200;
      case 'right':
        return spaceRight > rect.width / 2 || spaceRight > 200;
    }
  };

  if (fits(preferred)) return preferred;

  // Choose the direction with the most available space
  const bySpace: Array<[TourPlacement, number]> = [
    ['top', spaceTop],
    ['right', spaceRight],
    ['bottom', spaceBottom],
    ['left', spaceLeft],
  ];
  bySpace.sort((a, b) => b[1] - a[1]);

  return bySpace[0][0];
}
