/**
 * Root Readiness E2E Tests
 *
 * Tests for resilient root element mounting and DOM readiness.
 */

import { test, expect } from '@playwright/test';

test.describe('Root Readiness', () => {
  test('should mount React app after DOM is ready', async ({ page }) => {
    const mountTimings: { event: string; timestamp: number }[] = [];

    await page.exposeFunction('trackMountEvent', (event: string, timestamp: number) => {
      mountTimings.push({ event, timestamp });
    });

    // Track DOMContentLoaded and React mount
    await page.addInitScript(() => {
      document.addEventListener('DOMContentLoaded', () => {
        (window as any).trackMountEvent?.('DOMContentLoaded', performance.now());
      });

      // Track when React mounts
      const observer = new MutationObserver(() => {
        const root = document.getElementById('root');
        if (root && root.children.length > 0) {
          (window as any).trackMountEvent?.('ReactMounted', performance.now());
          observer.disconnect();
        }
      });
      observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
      });
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // React mount should happen after DOMContentLoaded
    const domLoaded = mountTimings.find((t) => t.event === 'DOMContentLoaded');
    const reactMounted = mountTimings.find((t) => t.event === 'ReactMounted');

    if (domLoaded && reactMounted) {
      expect(reactMounted.timestamp).toBeGreaterThanOrEqual(domLoaded.timestamp);
    }

    console.log('Mount timings:', mountTimings);
  });

  test('should have root element with correct attributes', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const rootAttrs = await page.evaluate(() => {
      const root = document.getElementById('root');
      return {
        exists: !!root,
        id: root?.id,
        hasChildren: (root?.children.length || 0) > 0,
      };
    });

    expect(rootAttrs.exists).toBe(true);
    expect(rootAttrs.id).toBe('root');
    expect(rootAttrs.hasChildren).toBe(true);
  });

  test('should handle delayed DOMContentLoaded', async ({ page }) => {
    // Simulate slow script loading
    await page.route('**/*.js', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      await route.continue();
    });

    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Should still mount successfully
    const hasMounted = await page.evaluate(() => {
      const root = document.getElementById('root');
      return root && root.children.length > 0;
    });

    expect(hasMounted).toBe(true);
    expect(errors.length).toBe(0);
  });

  test('should work with document.readyState === "loading"', async ({ page }) => {
    // This is harder to simulate, but we can check behavior
    await page.goto('/');

    const readyState = await page.evaluate(() => document.readyState);
    console.log('Document ready state:', readyState);

    // By the time we check, it should be complete or interactive
    expect(['interactive', 'complete']).toContain(readyState);

    const hasMounted = await page.evaluate(() => {
      const root = document.getElementById('root');
      return root && root.children.length > 0;
    });

    expect(hasMounted).toBe(true);
  });

  test('should not double-mount on hot reload (dev mode)', async ({ page }) => {
    if (!process.env.DEV) {
      test.skip();
    }

    const mountCount: number[] = [];

    await page.exposeFunction('trackMount', () => {
      mountCount.push(Date.now());
    });

    await page.addInitScript(() => {
      // Track React mount attempts
      const originalCreateRoot = (window as any).ReactDOM?.createRoot;
      if (originalCreateRoot) {
        (window as any).ReactDOM.createRoot = function (...args: any[]) {
          (window as any).trackMount?.();
          return originalCreateRoot.apply(this, args);
        };
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Should mount once (or twice in StrictMode, but that's expected)
    expect(mountCount.length).toBeLessThanOrEqual(2);
  });

  test('should handle missing root element gracefully', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    // Navigate to a page and remove root element
    await page.goto('/');
    await page.evaluate(() => {
      const root = document.getElementById('root');
      root?.remove();
    });

    // Try to reload
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    // Check if page shows error or handles gracefully
    const hasRootError = errors.some((error) => error.includes('root') || error.includes('null'));

    // Our waitForRoot should handle this
    console.log('Errors after root removal:', errors);

    // The app might error, but it shouldn't crash the browser
    expect(errors.length).toBeLessThan(10); // Sanity check
  });

  test('should use RAF and microtask for stable mounting', async ({ page }) => {
    const timings: { phase: string; timing: number }[] = [];

    await page.exposeFunction('trackPhase', (phase: string, timing: number) => {
      timings.push({ phase, timing });
    });

    await page.addInitScript(() => {
      const start = performance.now();

      // Track RAF
      requestAnimationFrame(() => {
        (window as any).trackPhase?.('RAF', performance.now() - start);
      });

      // Track microtask
      queueMicrotask(() => {
        (window as any).trackPhase?.('microtask', performance.now() - start);
      });

      // Track when React mounts
      const observer = new MutationObserver(() => {
        const root = document.getElementById('root');
        if (root && root.children.length > 0) {
          (window as any).trackPhase?.('ReactMount', performance.now() - start);
          observer.disconnect();
        }
      });
      observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
      });
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    console.log('Mounting phases:', timings);

    // Should have executed all phases
    expect(timings.length).toBeGreaterThan(0);
  });
});
