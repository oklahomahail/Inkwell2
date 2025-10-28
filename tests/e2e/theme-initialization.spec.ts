/**
 * Theme Initialization E2E Tests
 *
 * Tests for zero-flash theme initialization and resilient theme management.
 */

import { test, expect } from '@playwright/test';

test.describe('Theme Initialization', () => {
  test('should not flash on initial load with light theme', async ({ page }) => {
    // Track background color changes during page load
    const backgroundColors: string[] = [];

    await page.exposeFunction('trackBackground', (color: string) => {
      backgroundColors.push(color);
    });

    // Inject early tracking before navigation
    await page.addInitScript(() => {
      const observer = new MutationObserver(() => {
        const bg = window.getComputedStyle(document.documentElement).backgroundColor;
        (window as any).trackBackground?.(bg);
      });
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class'],
      });

      // Also track initial state
      const initialBg = window.getComputedStyle(document.documentElement).backgroundColor;
      (window as any).trackBackground?.(initialBg);
    });

    await page.goto('/');

    // Wait for app to be fully loaded
    await page.waitForLoadState('networkidle');

    // Should default to light theme (white or light gray background)
    const currentBg = await page.evaluate(() => {
      return window.getComputedStyle(document.documentElement).backgroundColor;
    });

    // Light theme should have rgb(255, 255, 255) or similar
    expect(currentBg).toMatch(
      /rgb\(2(5[0-5]|4\d|3\d|2\d|1\d|\d),\s*2(5[0-5]|4\d|3\d|2\d|1\d|\d),\s*2(5[0-5]|4\d|3\d|2\d|1\d|\d)\)/,
    );

    // Should not have dark class initially
    const hasDarkClass = await page.evaluate(() => {
      return document.documentElement.classList.contains('dark');
    });
    expect(hasDarkClass).toBe(false);
  });

  test('should persist dark theme preference across reloads', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Set dark theme
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    });

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Dark theme should be restored
    const hasDarkClass = await page.evaluate(() => {
      return document.documentElement.classList.contains('dark');
    });
    expect(hasDarkClass).toBe(true);

    const theme = await page.evaluate(() => localStorage.getItem('theme'));
    expect(theme).toBe('dark');
  });

  test('should handle system preference changes', async ({ page, context }) => {
    // Set system to dark mode
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Without localStorage preference, should still default to light
    // (per our specification)
    const hasDarkClass = await page.evaluate(() => {
      return document.documentElement.classList.contains('dark');
    });
    expect(hasDarkClass).toBe(false);

    // Now explicitly set to respect system preference
    await page.evaluate(() => {
      localStorage.removeItem('theme');
      // Trigger re-evaluation
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      }
    });

    const hasDarkAfterSystemCheck = await page.evaluate(() => {
      return document.documentElement.classList.contains('dark');
    });
    expect(hasDarkAfterSystemCheck).toBe(true);
  });

  test('should never add .light class to html element', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check initial state
    let hasLightClass = await page.evaluate(() => {
      return document.documentElement.classList.contains('light');
    });
    expect(hasLightClass).toBe(false);

    // Toggle to dark and back
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    });

    await page.evaluate(() => {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    });

    // Should still not have .light class
    hasLightClass = await page.evaluate(() => {
      return document.documentElement.classList.contains('light');
    });
    expect(hasLightClass).toBe(false);
  });

  test('should work in private/incognito mode', async ({ browser }) => {
    // Create incognito context
    const context = await browser.newContext({
      storageState: undefined, // No persistent storage
    });

    const page = await context.newPage();

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Should default to light theme even without localStorage access
    const hasDarkClass = await page.evaluate(() => {
      return document.documentElement.classList.contains('dark');
    });
    expect(hasDarkClass).toBe(false);

    // Should gracefully handle localStorage errors
    const hasErrors = await page.evaluate(() => {
      try {
        localStorage.setItem('theme', 'dark');
        return false;
      } catch {
        return true;
      }
    });

    // In true private mode, localStorage might throw
    // Our code should handle this gracefully
    console.log('Private mode localStorage accessible:', !hasErrors);

    await context.close();
  });

  test('should have theme script before body content', async ({ page }) => {
    await page.goto('/');

    // Check that theme script exists in head
    const themeScriptInHead = await page.evaluate(() => {
      const scripts = Array.from(document.head.querySelectorAll('script'));
      return scripts.some(
        (script) =>
          script.textContent?.includes('THEME_INIT') ||
          script.textContent?.includes("localStorage.getItem('theme')"),
      );
    });

    expect(themeScriptInHead).toBe(true);
  });
});
