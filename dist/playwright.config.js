"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
require("./cypress/support/e2e");
exports.default = (0, test_1.defineConfig)({
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
            use: { ...test_1.devices['Desktop Chrome'] },
        },
    ],
});
