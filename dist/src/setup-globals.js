"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupCypressGlobals = setupCypressGlobals;
const mocha_translator_1 = require("./mocha-translator");
/**
 * Creates a lightweight Chai-compatible `expect` wrapper.
 * This is injected into `globalThis.expect` by `setupCypressGlobals`.
 */
function createAssertion(value, negate = false) {
    const self = {
        get not() {
            return createAssertion(value, !negate);
        },
        get be() {
            return self;
        },
        get to() {
            return self;
        },
        get have() {
            return self;
        },
        get exist() {
            const exists = value !== null && value !== undefined;
            if (negate ? exists : !exists) {
                throw new Error(`Expected ${negate ? 'not to exist' : 'to exist'}: ${value}`);
            }
            return self;
        },
        get true() {
            if (negate ? value === true : value !== true) {
                throw new Error(`Expected ${negate ? 'not to be true' : 'to be true'}: ${value}`);
            }
            return self;
        },
        get false() {
            if (negate ? value === false : value !== false) {
                throw new Error(`Expected ${negate ? 'not to be false' : 'to be false'}: ${value}`);
            }
            return self;
        },
        a(type) {
            let matches = false;
            const actual = typeof value;
            if (type === 'null') {
                matches = value === null;
            }
            else if (type === 'undefined') {
                matches = value === undefined;
            }
            else if (type === 'array') {
                matches = Array.isArray(value);
            }
            else if (type === 'object') {
                matches = value !== null && typeof value === 'object' && !Array.isArray(value);
            }
            else if (type === 'string' || type === 'number' || type === 'boolean' || type === 'function' || type === 'symbol' || type === 'bigint') {
                matches = actual === type;
            }
            else {
                const ctor = globalThis[type] || (typeof window !== 'undefined' && window?.[type]);
                if (ctor) {
                    matches = value instanceof ctor;
                }
            }
            if (negate ? matches : !matches) {
                throw new Error(`Expected ${negate ? 'not to be a(n)' : 'to be a(n)'} ${type}, but got ${actual}`);
            }
            return self;
        },
        an(type) {
            return this.a(type);
        },
        property(property) {
            if (negate ? value[property] : !value[property]) {
                throw new Error(`Expected ${negate ? 'not to have' : 'to have'} property ${property}`);
            }
            return self;
        },
        eq(expected) {
            if (negate ? value === expected : value !== expected) {
                throw new Error(`Expected ${negate ? 'not to equal' : 'to equal'} ${expected}, but got ${value}`);
            }
            return self;
        },
        equal(expected) {
            return this.eq(expected);
        },
        gt(expected) {
            if (negate ? value > expected : !(value > expected)) {
                throw new Error(`Expected ${negate ? 'not to be above' : 'to be above'} ${expected}, but got ${value}`);
            }
            return self;
        },
        gte(expected) {
            if (negate ? value >= expected : !(value >= expected)) {
                throw new Error(`Expected ${negate ? 'not to be at least' : 'to be at least'} ${expected}, but got ${value}`);
            }
            return self;
        },
        lt(expected) {
            if (negate ? value < expected : !(value < expected)) {
                throw new Error(`Expected ${negate ? 'not to be below' : 'to be below'} ${expected}, but got ${value}`);
            }
            return self;
        },
        lte(expected) {
            if (negate ? value <= expected : !(value <= expected)) {
                throw new Error(`Expected ${negate ? 'not to be at most' : 'to be at most'} ${expected}, but got ${value}`);
            }
            return self;
        },
        length(expected) {
            const actual = value?.length ?? value;
            if (negate ? actual === expected : actual !== expected) {
                throw new Error(`Expected ${negate ? 'not to have' : 'to have'} length ${expected}, but got ${actual}`);
            }
            return self;
        },
        match(pattern) {
            const matches = pattern.test(value);
            if (negate ? matches : !matches) {
                throw new Error(`Expected ${negate ? 'not to match' : 'to match'} ${pattern}, but got ${value}`);
            }
            return self;
        },
        include(substring) {
            const includes = typeof value === 'string' && value.includes(substring);
            if (negate ? includes : !includes) {
                throw new Error(`Expected ${negate ? 'not to include' : 'to include'} "${substring}" in "${value}"`);
            }
            return self;
        },
    };
    return self;
}
function createCypressCompat(playwrightConfig) {
    return {
        get browser() {
            const cy = globalThis.cy;
            if (cy?.browser) {
                return cy.browser;
            }
            return {
                name: 'chromium',
                family: 'chromium',
                displayName: 'Chromium',
                version: '120.0',
                channel: 'stable',
                majorVersion: '120',
            };
        },
        config: (attr) => {
            if (!attr) {
                return playwrightConfig;
            }
            const configMap = {
                baseUrl: 'baseURL',
                viewportWidth: 'viewport.width',
                viewportHeight: 'viewport.height',
                defaultCommandTimeout: 'timeout',
                pageLoadTimeout: 'navigationTimeout',
                requestTimeout: 'timeout',
                responseTimeout: 'timeout',
            };
            const pwAttr = configMap[attr] || attr;
            if (pwAttr.includes('.')) {
                const [parent, child] = pwAttr.split('.');
                const parentValue = playwrightConfig.use?.[parent];
                return parentValue?.[child];
            }
            return playwrightConfig.use?.[pwAttr];
        },
        log: (options) => {
            const consoleProps = options.consoleProps ? options.consoleProps() : {};
            console.log(`[Cypress.log] ${options.name || ''}`, consoleProps);
        },
        Commands: {
            add(name, optionsOrFn, fn) {
                const actualFn = typeof optionsOrFn === 'function' ? optionsOrFn : fn;
                const options = typeof optionsOrFn === 'object' ? optionsOrFn : undefined;
                if (!actualFn)
                    return;
                globalThis.__cypressCustomCommands = globalThis.__cypressCustomCommands || {};
                globalThis.__cypressCustomCommands[name] = actualFn;
                globalThis.__cypressCustomCommandOptions = globalThis.__cypressCustomCommandOptions || {};
                globalThis.__cypressCustomCommandOptions[name] = options;
            },
            overwrite(name, fn) {
                globalThis.__cypressCustomCommands = globalThis.__cypressCustomCommands || {};
                globalThis.__cypressOriginalCommands = globalThis.__cypressOriginalCommands || {};
                globalThis.__cypressOriginalCommands[name] = globalThis.__cypressCustomCommands[name] || null;
                globalThis.__cypressCustomCommands[name] = fn;
            },
        },
    };
}
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
function setupCypressGlobals(playwrightConfig) {
    if (globalThis.__cypressGlobalsSetup)
        return;
    globalThis.__cypressGlobalsSetup = true;
    globalThis.expect = (value) => createAssertion(value);
    globalThis.describe = mocha_translator_1.describe;
    globalThis.context = mocha_translator_1.context;
    globalThis.it = mocha_translator_1.it;
    globalThis.before = mocha_translator_1.before;
    globalThis.after = mocha_translator_1.after;
    globalThis.beforeEach = mocha_translator_1.beforeEach;
    globalThis.afterEach = mocha_translator_1.afterEach;
    globalThis.xdescribe = mocha_translator_1.xdescribe;
    globalThis.xit = mocha_translator_1.xit;
    globalThis.Cypress = createCypressCompat(playwrightConfig);
}
