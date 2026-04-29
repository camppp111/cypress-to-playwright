/**
 * Injects Cypress-style globals (`describe`, `it`, `expect`, `Cypress`)
 * into `globalThis` so existing Cypress spec files can run under
 * Playwright without modification.
 *
 * Call this **once** in your `playwright.config.ts` (or equivalent
 * setup file) **before** any test files are loaded.
 *
 * @example
 * ```ts
 * import { defineConfig } from '@playwright/test';
 * import { setupCypressGlobals } from 'cypress-to-playwright';
 *
 * setupCypressGlobals();
 *
 * export default defineConfig({
 *   testDir: './cypress/integration',
 * });
 * ```
 */
export declare function setupCypressGlobals(playwrightConfig?: any): void;
