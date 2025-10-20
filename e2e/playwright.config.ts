import { defineConfig } from '@playwright/test';

export default defineConfig({
  // Directory containing test files
  testDir: './',

  // Maximum time one test can run for
  timeout: 30000,

  // Fail the build if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Reporter to use
  reporter: process.env.CI ? 'github' : 'list',

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: {
        // Use the standard Chromium browser
        browserName: 'chromium',
        // All requests we send have credentials (cookies, etc)
        contextOptions: {
          ignoreHTTPSErrors: true,
        },
      },
    },
  ],

  // Configure Playwright to use dotenv
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: process.env.PREVIEW_URL || 'http://localhost:5173',

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Record screenshots
    screenshot: 'only-on-failure',
  },
});
