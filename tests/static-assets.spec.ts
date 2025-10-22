// tests/static-assets.spec.ts
import { test, expect } from '@playwright/test';

/**
 * This test suite verifies that static assets are served correctly
 * with appropriate content types and without middleware redirection
 */
test.describe('Static Asset Verification', () => {
  test('HTML routes have correct content type', async ({ page, request }) => {
    // Test HTML route
    const response = await request.get('/sign-in');
    expect(response.ok()).toBeTruthy();
    expect(response.headers()['content-type']).toContain('text/html');
  });

  test('CSS assets have correct content type', async ({ page, request }) => {
    // First load the page to discover CSS assets
    await page.goto('/');

    // Find a CSS asset URL from the Network tab
    const cssAsset = await page.evaluate(() => {
      const links = Array.from(
        document.querySelectorAll('link[rel="stylesheet"]'),
      ) as HTMLLinkElement[];
      return links.length > 0 ? links[0].href : null;
    });

    expect(cssAsset).not.toBeNull();

    // Now request that specific CSS asset
    if (cssAsset) {
      const cssUrl = new URL(cssAsset).pathname;
      const cssResponse = await request.get(cssUrl);

      expect(cssResponse.ok()).toBeTruthy();
      expect(cssResponse.headers()['content-type']).toContain('text/css');
    }

    expect(cssResponse.ok()).toBeTruthy();
    expect(cssResponse.headers()['content-type']).toContain('text/css');
  });

  test('JS assets have correct content type', async ({ page, request }) => {
    // Load the page to discover JS assets
    await page.goto('/');

    // Find a JS asset URL
    const jsAsset = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script[src]')) as HTMLScriptElement[];
      return scripts.length > 0 ? scripts[0].src : null;
    });

    expect(jsAsset).not.toBeNull();

    // Request that specific JS asset
    if (jsAsset) {
      const jsUrl = new URL(jsAsset).pathname;
      const jsResponse = await request.get(jsUrl);

      expect(jsResponse.ok()).toBeTruthy();
      expect(jsResponse.headers()['content-type']).toContain('application/javascript');
    }
  });

  test('Service Worker has correct content type', async ({ request }) => {
    const swResponse = await request.get('/registerSW.js');
    expect(swResponse.ok()).toBeTruthy();
    expect(swResponse.headers()['content-type']).toContain('application/javascript');
  });

  test('Web Manifest has correct content type', async ({ request }) => {
    const manifestResponse = await request.get('/site.webmanifest');
    expect(manifestResponse.ok()).toBeTruthy();
    expect(manifestResponse.headers()['content-type']).toContain('application/manifest+json');
  });

  test('Static assets bypass auth middleware', async ({ request }) => {
    // Test a few different static asset types
    const assetTypes = [
      '/assets/index-chunk.js', // Will use actual chunk name from earlier tests
      '/registerSW.js',
      '/site.webmanifest',
      '/favicon.ico',
    ];

    // Get a JS asset path dynamically
    const page = await request.get('/');
    const pageText = await page.text();
    const assetMatch = pageText.match(/\/assets\/[^"']+\.js/);

    if (assetMatch) {
      assetTypes[0] = assetMatch[0];
    }

    for (const asset of assetTypes) {
      const response = await request.get(asset);

      // Should not redirect to sign-in page
      expect(response.url()).not.toContain('/sign-in');
      expect(response.status()).not.toBe(302);
      expect(response.ok()).toBeTruthy();
    }
  });

  test('Cache headers are set correctly', async ({ request }) => {
    // Check HTML route (should have no-store or short cache)
    const htmlResponse = await request.get('/sign-in');
    const htmlCache = htmlResponse.headers()['cache-control'] || '';
    expect(
      htmlCache.includes('no-store') ||
        htmlCache.includes('max-age=0') ||
        htmlCache.includes('must-revalidate'),
    ).toBeTruthy();

    // Check asset (should have long cache, immutable)
    // First discover an asset URL
    const page = await request.get('/');
    const pageText = await page.text();
    const assetMatch = pageText.match(/\/assets\/[^"']+\.js/);

    if (assetMatch) {
      const assetPath = assetMatch[0];
      const assetResponse = await request.get(assetPath);
      const assetCache = assetResponse.headers()['cache-control'] || '';

      expect(assetCache.includes('max-age=')).toBeTruthy();
      // Ideally it would have immutable too, but not strictly required
    }
  });
});
