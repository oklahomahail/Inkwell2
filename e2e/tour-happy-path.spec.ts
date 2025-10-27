/**
 * E2E Test: Tour Happy Path
 *
 * Verifies the complete tour experience from modal to completion.
 */

import { test, expect } from '@playwright/test';

test.describe('Tour Happy Path', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app
    await page.goto('/');

    // Wait for app to be ready
    await page.waitForLoadState('networkidle');
  });

  test('should open modal and start tour successfully', async ({ page }) => {
    // Open welcome modal (adjust selector based on your trigger)
    const welcomeButton = page.getByRole('button', { name: /start tour|take a tour|welcome/i });

    if (await welcomeButton.isVisible()) {
      await welcomeButton.click();
    }

    // Wait for modal to appear
    const modal = page.locator('[role="dialog"]').filter({ hasText: /welcome to inkwell/i });
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Click "Start Tour" button
    const startTourBtn = modal.getByRole('button', { name: /start tour/i });
    await startTourBtn.click();

    // Verify overlay appears within 400ms
    const overlay = page.locator('[data-spotlight-overlay],[data-tour-overlay]');
    await expect(overlay).toBeVisible({ timeout: 400 });

    // Verify first step is visible
    const firstStep = page.locator('[data-tour-step]').first();
    await expect(firstStep).toBeVisible({ timeout: 1000 });

    // Navigate through tour steps
    let stepCount = 0;
    const maxSteps = 10; // Safety limit

    while (stepCount < maxSteps) {
      const nextButton = page.getByRole('button', { name: /next/i });
      const completeButton = page.getByRole('button', { name: /complete|finish|done/i });

      if (await completeButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        // Last step - complete the tour
        await completeButton.click();
        break;
      } else if (await nextButton.isVisible({ timeout: 1000 })) {
        // Intermediate step - click next
        await nextButton.click();
        stepCount++;
        // Wait a bit for transition
        await page.waitForTimeout(300);
      } else {
        break;
      }
    }

    // Verify tour completed
    await expect(overlay).not.toBeVisible({ timeout: 2000 });

    // Verify completion state is set (check localStorage or state)
    const tourCompleted = await page.evaluate(() => {
      return localStorage.getItem('tour:inkwell-onboarding-v1:done') === 'true';
    });
    expect(tourCompleted).toBe(true);
  });

  test('should handle missing anchors gracefully', async ({ page }) => {
    // Temporarily remove a tour target element
    await page.evaluate(() => {
      const banner = document.querySelector('[data-tour-id="storage-banner"]');
      if (banner) {
        banner.remove();
      }
    });

    // Start tour via console
    await page.evaluate(() => {
      (window as any).inkwellStartTour();
    });

    // Verify tour still appears
    const overlay = page.locator('[data-spotlight-overlay],[data-tour-overlay]');
    await expect(overlay).toBeVisible({ timeout: 1000 });

    // Tour should continue past the missing step
    const nextButton = page.getByRole('button', { name: /next/i });
    await expect(nextButton).toBeVisible({ timeout: 1000 });

    // Click through remaining steps
    for (let i = 0; i < 3; i++) {
      if (await nextButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await nextButton.click();
        await page.waitForTimeout(200);
      }
    }

    // Tour should still be able to complete
    const completeButton = page.getByRole('button', { name: /complete|finish|done/i });
    if (await completeButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await completeButton.click();
    }
  });

  test('should start tour immediately via console', async ({ page }) => {
    // Call inkwellStartTour from console
    await page.evaluate(() => {
      (window as any).inkwellStartTour();
    });

    // Verify overlay appears immediately
    const overlay = page.locator('[data-spotlight-overlay],[data-tour-overlay]');
    await expect(overlay).toBeVisible({ timeout: 500 });

    // Verify first step content
    const tourContent = page.locator('[data-tour-step]').first();
    await expect(tourContent).toContainText(/welcome/i, { timeout: 1000 });
  });

  test('should allow tour restart from help menu', async ({ page }) => {
    // Complete the tour first
    await page.evaluate(() => {
      localStorage.setItem('tour:inkwell-onboarding-v1:done', 'true');
    });

    // Try to restart via console (simulating help menu)
    await page.evaluate(() => {
      (window as any).inkwellStartTour();
    });

    // Verify tour starts again
    const overlay = page.locator('[data-spotlight-overlay],[data-tour-overlay]');
    await expect(overlay).toBeVisible({ timeout: 1000 });
  });
});
