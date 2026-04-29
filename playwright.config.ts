import { defineConfig, devices } from '@playwright/test';
import './cypress/support/e2e';

export default defineConfig({
  testDir: 'cypress',
  testMatch: ['**/*.spec.ts', '**/*.spec.js'],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  timeout: 30000,
  use: {
    baseURL: 'https://www.example.com',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    navigationTimeout: 10000,
    actionTimeout: 10000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
