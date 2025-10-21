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
    // Watch for DOM changes - with guard for safety
    const node = document.body;
    if (!node || !(node instanceof Node)) {
      console.warn('resolveTarget: document.body is not a Node');
      setTimeout(() => resolve(tryFind()), 100); // Fallback to simple timeout
      return;
    }

    // Create observer after we know we have a valid node
    let observer: MutationObserver | null = null;
    try {
      observer = new MutationObserver(() => {
        const element = tryFind();
        if (element) {
          if (observer) observer.disconnect();
          resolve(element);
        }
      });

      try {
        observer.observe(node, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['class', 'style', 'data-tour'],
        });
      } catch (e) {
        console.warn('[MO] observe skipped, invalid node', e, node);
        setTimeout(() => resolve(tryFind()), 100); // Fallback
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

  const { timeout = 2000, rootNode = document, retries = 3 } = options;

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
    const checkTimeout = () => Date.now() - startTime > timeout;

    // Get the node to observe (default to document.body)
    const node = rootNode instanceof Document ? rootNode.body : rootNode;
    if (!node || !(node instanceof Node)) {
      console.warn('findTargetWithRetry: rootNode is not a Node:', rootNode);
      setTimeout(() => resolve(tryFind()), 100); // Fallback to simple timeout
      return;
    }

    // Create observer after we know we have a valid node
    let observer: MutationObserver | null = null;
    try {
      observer = new MutationObserver(() => {
        const element = tryFind();
        if (element) {
          if (observer) observer.disconnect();
          resolve(element);
        }
      });

      try {
        observer.observe(node, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['class', 'style', 'data-tour'],
        });
      } catch (e) {
        console.warn('[MO] observe skipped, invalid node', e, node);
        setTimeout(() => resolve(tryFind()), 100); // Fallback
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
