const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 60000,
  expect: {
    timeout: 15000
  },
  retries: 2,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : '50%',
  reporter: process.env.CI ? 'junit' : 'dot',
  use: {
    actionTimeout: 10000,
    navigationTimeout: 20000,
    trace: 'on-first-retry',
    video: 'on-first-retry',
    // Ignore console logs to prevent them being treated as errors
    logger: {
      isEnabled: (name, severity) => severity === 'error' && name !== 'browser'
    }
  },
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
      },
    },
    ...(process.env.FULL_BROWSER_TESTS ? [
      {
        name: 'firefox',
        use: {
          browserName: 'firefox',
        },
      },
      {
        name: 'webkit',
        use: {
          browserName: 'webkit',
        },
      },
    ] : []),
  ],
});
