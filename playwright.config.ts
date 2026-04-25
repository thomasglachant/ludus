import { defineConfig, devices } from '@playwright/test';

const enabledDemoBaseUrl = 'http://127.0.0.1:4173';
const disabledDemoBaseUrl = 'http://127.0.0.1:4174';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  use: {
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
  webServer: [
    {
      command: 'npm run dev -- --host 127.0.0.1 --port 4173',
      env: {
        VITE_ENABLE_DEMO_MODE: 'true',
      },
      reuseExistingServer: !process.env.CI,
      url: enabledDemoBaseUrl,
    },
    {
      command: 'npm run dev -- --host 127.0.0.1 --port 4174',
      env: {
        VITE_ENABLE_DEMO_MODE: 'false',
      },
      reuseExistingServer: !process.env.CI,
      url: disabledDemoBaseUrl,
    },
  ],
});
