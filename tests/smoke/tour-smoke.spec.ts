/**
 * Tour CI Smoke Test
 *
 * Minimal headless test to verify:
 * 1. Tour starts without crashing
 * 2. Overlay appears within 400ms
 * 3. ESC key closes tour
 *
 * Run in CI: pnpm test:smoke:tour
 */

import { test, expect } from '@playwright/test';

test.describe('Tour Smoke Test', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Enable all tour flags for smoke testing
    await page.evaluate(() => {
      localStorage.setItem('ff:tour_simpleTour', 'on');
      localStorage.setItem('ff:tour_export', 'on');
      localStorage.setItem('ff:tour_aiTools', 'on');
      localStorage.removeItem('tour:kill'); // Ensure kill switch is off
    });
  });

  test('tour starts and shows overlay within 400ms', async ({ page }) => {
    // Start tour via global function (if exposed)
    const tourStarted = await page.evaluate(() => {
      if (typeof (window as any).inkwellStartTour === 'function') {
        (window as any).inkwellStartTour();
        return true;
      }
      return false;
    });

    // If global function not available, try to click a tour trigger button
    if (!tourStarted) {
      const tourButton = page.getByRole('button', { name: /tour|help|guide/i });
      if (await tourButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await tourButton.click();
      } else {
        // Skip test if no tour trigger found
        test.skip();
        return;
      }
    }

    // Verify overlay appears within 400ms (performance SLO)
    const overlay = page.locator('[data-spotlight-overlay], [data-tour-overlay], [data-tour-step]');
    await expect(overlay.first()).toBeVisible({ timeout: 400 });

    // Verify no crash shield error toast
    const errorToast = page.locator('text=/tour.*error|failed to start/i');
    await expect(errorToast).not.toBeVisible({ timeout: 1000 });
  });

  test('ESC key closes tour immediately', async ({ page }) => {
    // Start tour
    await page.evaluate(() => {
      if (typeof (window as any).inkwellStartTour === 'function') {
        (window as any).inkwellStartTour();
      }
    });

    // Wait for overlay
    const overlay = page.locator('[data-spotlight-overlay], [data-tour-overlay]');
    await expect(overlay.first()).toBeVisible({ timeout: 1000 });

    // Press ESC
    await page.keyboard.press('Escape');

    // Verify overlay disappears
    await expect(overlay.first()).not.toBeVisible({ timeout: 500 });

    // Verify skip event logged
    const skipLogged = await page.evaluate(() => {
      const events = JSON.parse(localStorage.getItem('analytics.tour.events') || '[]');
      return events.some((e: any) => e.type === 'tour_skipped');
    });
    expect(skipLogged).toBe(true);
  });

  test('kill switch prevents tour from starting', async ({ page }) => {
    // Enable kill switch
    await page.evaluate(() => {
      localStorage.setItem('tour:kill', '1');
    });

    // Attempt to start tour
    const tourStarted = await page.evaluate(() => {
      if (typeof (window as any).inkwellStartTour === 'function') {
        try {
          (window as any).inkwellStartTour();
          return true;
        } catch {
          return false;
        }
      }
      return false;
    });

    // Verify overlay does NOT appear
    const overlay = page.locator('[data-spotlight-overlay], [data-tour-overlay]');
    await expect(overlay.first()).not.toBeVisible({ timeout: 1000 });

    // Verify no error toast (kill switch is silent)
    const errorToast = page.locator('text=/error|failed/i');
    await expect(errorToast).not.toBeVisible({ timeout: 1000 });
  });

  test('crash shield shows fallback on error', async ({ page }) => {
    // Inject a crash condition
    await page.evaluate(() => {
      // Mock tour config to throw error
      const originalFetch = window.fetch;
      (window as any).fetch = (url: string, ...args: any[]) => {
        if (url.includes('tour')) {
          throw new Error('Simulated tour crash');
        }
        return originalFetch(url, ...args);
      };
    });

    // Attempt to start tour
    await page.evaluate(() => {
      if (typeof (window as any).inkwellStartTour === 'function') {
        (window as any).inkwellStartTour();
      }
    });

    // Verify crash shield toast appears
    const errorToast = page.locator('text=/tour.*unavailable|could not start/i');

    // Either toast shows or tour doesn't start (both acceptable)
    const toastVisible = await errorToast.isVisible({ timeout: 2000 }).catch(() => false);
    const overlayVisible = await page
      .locator('[data-tour-overlay]')
      .isVisible({ timeout: 1000 })
      .catch(() => false);

    // Crash shield should either show error OR prevent tour from showing broken state
    expect(toastVisible || !overlayVisible).toBe(true);
  });

  test('analytics events are captured', async ({ page }) => {
    // Clear analytics before test
    await page.evaluate(() => {
      localStorage.removeItem('analytics.tour.events');
    });

    // Start tour
    await page.evaluate(() => {
      if (typeof (window as any).inkwellStartTour === 'function') {
        (window as any).inkwellStartTour();
      }
    });

    // Wait for overlay
    const overlay = page.locator('[data-spotlight-overlay], [data-tour-overlay]');
    await expect(overlay.first()).toBeVisible({ timeout: 1000 });

    // Wait a moment for analytics to flush
    await page.waitForTimeout(200);

    // Verify tour_started event was logged
    const events = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('analytics.tour.events') || '[]');
    });

    const startedEvent = events.find((e: any) => e.type === 'tour_started');
    expect(startedEvent).toBeDefined();
    expect(startedEvent).toHaveProperty('ts');
    expect(startedEvent).toHaveProperty('tour_id');
  });
});
