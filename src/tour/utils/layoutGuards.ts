/**
 * Layout Stability Guards for Tour
 * Ensures tour measurements happen after fonts, images, and layout are settled
 * Prevents misalignment from late-loading assets and CSS transitions
 */

import devLog from '@/utils/devLog';

/**
 * Wait for layout to settle before taking measurements
 * - Waits for fonts to load (if available)
 * - Waits for images to complete
 * - Requests one animation frame to flush layout calculations
 */
export async function waitForLayoutSettled(): Promise<void> {
  try {
    // 1) Wait for fonts (if document.fonts API is available)
    try {
      await (document as any).fonts?.ready;
      devLog.debug('[Tour] Fonts settled');
    } catch (_e) {
      // fonts API may not be available, continue
    }

    // 2) Wait for all images to load or fail
    const pendingImages = Array.from(document.images).filter((img) => !img.complete);

    if (pendingImages.length > 0) {
      await Promise.allSettled(
        pendingImages.map(
          (img) =>
            new Promise<void>((res) => {
              // Image already loaded (check one more time in case of race)
              if (img.complete) {
                res();
                return;
              }
              // Set handlers to resolve when image loads or fails
              const onEnd = () => {
                img.onload = null;
                img.onerror = null;
                res();
              };
              img.onload = onEnd;
              img.onerror = onEnd;
            }),
        ),
      );
      devLog.debug(`[Tour] ${pendingImages.length} images settled`);
    }

    // 3) One RAF to flush pending layout calculations
    await new Promise<void>((r) => requestAnimationFrame(() => r()));
    devLog.debug('[Tour] Layout settled');
  } catch (error) {
    devLog.warn('[Tour] Layout settlement encountered error:', error);
    // Don't throw - continue with tour even if settlement partially fails
  }
}

/**
 * Observe an anchor element for changes (resize, intersection, DOM changes)
 * Triggers callback when element's position/size changes
 * Returns cleanup function to disconnect observers
 */
export function observeAnchor(
  anchor: HTMLElement,
  onChange: (reason?: string) => void,
): () => void {
  const observers: (ResizeObserver | IntersectionObserver)[] = [];

  try {
    // ResizeObserver: detects size changes (CSS transitions, parent resize, etc)
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(() => {
        devLog.debug('[Tour] Anchor resized, re-measuring');
        onChange('resize');
      });
      ro.observe(anchor);
      observers.push(ro);
    }

    // IntersectionObserver: detects position/visibility changes
    if (typeof IntersectionObserver !== 'undefined') {
      const io = new IntersectionObserver(
        () => {
          devLog.debug('[Tour] Anchor intersection changed, re-measuring');
          onChange('intersection');
        },
        {
          root: null,
          threshold: [0, 0.01, 0.25, 0.5, 0.75, 0.99, 1],
        },
      );
      io.observe(anchor);
      observers.push(io);
    }
  } catch (error) {
    devLog.warn('[Tour] Failed to set up anchor observers:', error);
  }

  // Return cleanup function
  return () => {
    observers.forEach((obs) => {
      try {
        obs.disconnect();
      } catch (_e) {
        // Ignore disconnect errors
      }
    });
  };
}

/**
 * Debounced re-measure: waits a tick to avoid thrashing
 * Useful when onChange callback fires multiple times in rapid succession
 */
export function createDebouncedMeasure(
  measureFn: () => void,
  delayMs: number = 16,
): {
  trigger: () => void;
  cancel: () => void;
} {
  let timeoutId: NodeJS.Timeout | null = null;

  return {
    trigger: () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        measureFn();
        timeoutId = null;
      }, delayMs);
    },
    cancel: () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    },
  };
}

/**
 * Check if element is visible in viewport
 * Returns null if element is out of bounds (off-screen)
 */
export function isElementInViewport(element: HTMLElement): boolean {
  if (!element) return false;

  const rect = element.getBoundingClientRect();
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth;

  // Element is completely out of view if:
  // - Bottom is above top of viewport
  // - Top is below bottom of viewport
  // - Right is left of viewport
  // - Left is right of viewport
  return !(
    rect.bottom <= 0 ||
    rect.top >= viewportHeight ||
    rect.right <= 0 ||
    rect.left >= viewportWidth
  );
}

/**
 * Telemetry: Log tour step measurements
 * Use to track and debug positioning issues
 */
export interface TourStepMeasurement {
  stepId: string;
  x: number;
  y: number;
  w: number;
  h: number;
  viewportW: number;
  viewportH: number;
  isInViewport: boolean;
}

export interface TourStepAdjustment {
  stepId: string;
  beforeRect: DOMRect;
  afterRect: DOMRect;
  reason: 'resize' | 'imageLoad' | 'fontLoad' | 'scroll' | 'intersection';
  deltaX: number;
  deltaY: number;
  deltaW: number;
  deltaH: number;
}

/**
 * Create measurement record for telemetry
 */
export function recordMeasurement(stepId: string, element: HTMLElement): TourStepMeasurement {
  const rect = element.getBoundingClientRect();
  return {
    stepId,
    x: Math.round(rect.left),
    y: Math.round(rect.top),
    w: Math.round(rect.width),
    h: Math.round(rect.height),
    viewportW: window.innerWidth,
    viewportH: window.innerHeight,
    isInViewport: isElementInViewport(element),
  };
}

/**
 * Create adjustment record for telemetry
 */
export function recordAdjustment(
  stepId: string,
  beforeRect: DOMRect,
  afterRect: DOMRect,
  reason: TourStepAdjustment['reason'],
): TourStepAdjustment {
  return {
    stepId,
    beforeRect,
    afterRect,
    reason,
    deltaX: Math.round(afterRect.left - beforeRect.left),
    deltaY: Math.round(afterRect.top - beforeRect.top),
    deltaW: Math.round(afterRect.width - beforeRect.width),
    deltaH: Math.round(afterRect.height - beforeRect.height),
  };
}
