// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Playwright configuration for AgroBot BD end-to-end tests.
 * Tests run against the Vite dev server (port 3000) which proxies
 * API calls to the Express backend (port 5000).
 */
module.exports = defineConfig({
  // Folder where test files live
  testDir: './tests',

  // Run tests in parallel for speed
  fullyParallel: false,

  // Fail the build on CI if you accidentally left test.only
  forbidOnly: !!process.env.CI,

  // No retries locally; 1 retry on CI
  retries: process.env.CI ? 1 : 0,

  // One worker to avoid race conditions on shared DB
  workers: 1,

  // HTML report saved to playwright-report/
  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    // Base URL — Vite dev server
    baseURL: 'http://localhost:3000',

    // Keep a trace on first retry so you can debug failures
    trace: 'on-first-retry',

    // Take screenshot on failure
    screenshot: 'only-on-failure',

    // Reasonable timeout per action
    actionTimeout: 10000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Timeout per test (30 seconds)
  timeout: 30000,
});
