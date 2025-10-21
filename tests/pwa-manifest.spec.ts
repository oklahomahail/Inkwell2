import { test, expect } from '@playwright/test';

test('manifest serves with correct content-type', async ({ request }) => {
  // Make a request to the manifest file
  const response = await request.get('/site.webmanifest');

  // Verify the request succeeded
  expect(response.ok()).toBeTruthy();

  // Verify the content type header is correct
  expect(response.headers()['content-type']).toContain('application/manifest+json');

  // Try to parse the response as JSON to verify it's valid
  const manifestContent = await response.json();
  expect(manifestContent).toHaveProperty('name');
  expect(manifestContent).toHaveProperty('icons');
});

test('auth redirect flow works correctly', async ({ page }) => {
  // Start at the root
  await page.goto('/');

  // Should be redirected to sign-in page
  await expect(page).toHaveURL(/sign-in/);

  // We should see the sign-in form
  await expect(page.locator('form')).toBeVisible();

  // If we try to navigate to dashboard while logged out
  await page.goto('/dashboard');

  // Should be redirected back to sign-in
  await expect(page).toHaveURL(/sign-in/);

  // No infinite redirect loop - check URL doesn't have multiple _once params
  const url = page.url();
  const onceCount = (url.match(/_once/g) || []).length;
  expect(onceCount).toBeLessThanOrEqual(1);
});

test('icons are correctly served', async ({ page, request }) => {
  // Check icon file availability
  const iconResponse = await request.get('/icons/icon-192x192.png');
  expect(iconResponse.ok()).toBeTruthy();

  // Visit the main page to test the manifest loading in the browser
  await page.goto('/');

  // Wait for page to load
  await page.waitForLoadState('networkidle');

  // Check for any manifest errors in the console
  const consoleMessages: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error' && msg.text().includes('manifest')) {
      consoleMessages.push(msg.text());
    }
  });

  // Navigate to trigger possible manifest issues
  await page.goto('/dashboard');
  await page.goto('/');

  // There should be no manifest errors in the console
  expect(consoleMessages.length).toBe(0);
});
