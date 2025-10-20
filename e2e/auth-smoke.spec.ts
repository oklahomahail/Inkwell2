import { test, expect } from '@playwright/test';

/**
 * Authentication Flow Smoke Test
 *
 * This test validates that the authentication flow correctly preserves
 * redirect URLs with query parameters through the entire sign-in process.
 *
 * It can be run against any deployment of Inkwell to catch regressions
 * in the authentication flow, especially after Supabase SDK upgrades.
 */
test('Authentication flow preserves redirect URL with query parameters', async ({ page }) => {
  // Test a complex path with query params
  const targetPath = '/p/test-123?tab=characters&view=grid';
  const baseUrl = process.env.PREVIEW_URL || 'http://localhost:5173';

  // 1. Visit sign-in page with redirect
  await page.goto(`${baseUrl}/sign-in?redirect=${encodeURIComponent(targetPath)}`);

  // 2. Check that the form and redirect parameter are present
  await expect(page.locator('form')).toBeVisible();

  // 3. Fill in email (using a test account)
  await page.fill('input[type="email"]', process.env.TEST_EMAIL || 'test-user@example.com');

  // 4. Intercept the form submission to validate the redirect is preserved
  const requestPromise = page.waitForRequest(
    (request) => request.url().includes('/auth/v1/otp') && request.method() === 'POST',
  );

  // 5. Submit the form
  await page.click('button[type="submit"]');

  // 6. Wait for request and inspect payload
  const request = await requestPromise;
  const requestData = request.postDataJSON();

  // 7. Verify the redirect URL contains our path with query parameters
  expect(requestData.options?.emailRedirectTo).toContain(encodeURIComponent(targetPath));

  // 8. Verify success message is shown
  await expect(page.locator('text=Check your email')).toBeVisible();

  // In a real CI environment with auth mocks:
  if (process.env.MOCK_AUTH === 'true') {
    // 9. Simulate clicking the magic link by directly navigating to the callback URL
    await page.goto(
      `${baseUrl}/auth/callback?code=mock-code&redirect=${encodeURIComponent(targetPath)}`,
    );

    // 10. Verify we're redirected to the target path with query params preserved
    await page.waitForURL(
      (url) =>
        url.pathname.startsWith('/p/test-123') &&
        url.searchParams.get('tab') === 'characters' &&
        url.searchParams.get('view') === 'grid',
    );

    // 11. Additional verification that we're on the right page
    expect(page.url()).toContain(targetPath);
  }
});

// Test that the safe redirect protection works
test('Safe redirect protection blocks open redirect attempts', async ({ page }) => {
  const baseUrl = process.env.PREVIEW_URL || 'http://localhost:5173';

  // 1. Visit sign-in page with a malicious redirect
  const maliciousRedirect = 'https://evil.example.com';
  await page.goto(`${baseUrl}/sign-in?redirect=${encodeURIComponent(maliciousRedirect)}`);

  // 2. Setup console warning listener
  const consoleMessages: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'warning') {
      consoleMessages.push(msg.text());
    }
  });

  // 3. Fill in email and submit
  await page.fill('input[type="email"]', process.env.TEST_EMAIL || 'test-user@example.com');
  await page.click('button[type="submit"]');

  // 4. Verify warning was logged
  expect(
    consoleMessages.some(
      (msg) => msg.includes('Blocked unsafe redirect') && msg.includes(maliciousRedirect),
    ),
  ).toBe(true);

  // 5. In mock mode, verify redirect to default location
  if (process.env.MOCK_AUTH === 'true') {
    // Simulate clicking the magic link
    await page.goto(
      `${baseUrl}/auth/callback?code=mock-code&redirect=${encodeURIComponent(maliciousRedirect)}`,
    );

    // Should redirect to safe default location, not the malicious URL
    await page.waitForURL((url) => url.pathname.startsWith('/dashboard'));
    expect(page.url()).not.toContain(maliciousRedirect);
  }
});
