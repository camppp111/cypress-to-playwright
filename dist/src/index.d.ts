import { Page, BrowserContext } from '@playwright/test';
export declare function setupCypressToPlaywright(page: Page, context?: BrowserContext): any;
export { CommandTranslator } from './cypress-translator';
export { CypressCommandProxy } from './proxy';
export { setupCypressGlobals } from './setup-globals';
export type { CypressCommand, PlaywrightCommand } from './types';
export { describe, context, it, before, after, beforeEach, afterEach, xdescribe, xit } from './mocha-translator';
