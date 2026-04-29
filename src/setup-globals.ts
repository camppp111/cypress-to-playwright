import {
  describe as pwDescribe,
  context as pwContext,
  it as pwIt,
  before as pwBefore,
  after as pwAfter,
  beforeEach as pwBeforeEach,
  afterEach as pwAfterEach,
  xdescribe as pwXdescribe,
  xit as pwXit,
} from './mocha-translator';

/**
 * Creates a lightweight Chai-compatible `expect` wrapper.
 * This is injected into `globalThis.expect` by `setupCypressGlobals`.
 */
function createAssertion(value: any, negate: boolean = false): any {
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
    a(type: string) {
      let matches = false;
      const actual = typeof value;
      if (type === 'null') {
        matches = value === null;
      } else if (type === 'undefined') {
        matches = value === undefined;
      } else if (type === 'array') {
        matches = Array.isArray(value);
      } else if (type === 'object') {
        matches = value !== null && typeof value === 'object' && !Array.isArray(value);
      } else if (type === 'string' || type === 'number' || type === 'boolean' || type === 'function' || type === 'symbol' || type === 'bigint') {
        matches = actual === type;
      } else {
        const ctor = (globalThis as any)[type] || (typeof window !== 'undefined' && (window as any)?.[type]);
        if (ctor) {
          matches = value instanceof ctor;
        }
      }
      if (negate ? matches : !matches) {
        throw new Error(`Expected ${negate ? 'not to be a(n)' : 'to be a(n)'} ${type}, but got ${actual}`);
      }
      return self;
    },
    an(type: string) {
      return this.a(type);
    },
    property(property: string) {
      if (negate ? value[property] : !value[property]) {
        throw new Error(`Expected ${negate ? 'not to have' : 'to have'} property ${property}`);
      }
      return self;
    },
    eq(expected: any) {
      if (negate ? value === expected : value !== expected) {
        throw new Error(`Expected ${negate ? 'not to equal' : 'to equal'} ${expected}, but got ${value}`);
      }
      return self;
    },
    equal(expected: any) {
      return this.eq(expected);
    },
    gt(expected: number) {
      if (negate ? value > expected : !(value > expected)) {
        throw new Error(`Expected ${negate ? 'not to be above' : 'to be above'} ${expected}, but got ${value}`);
      }
      return self;
    },
    gte(expected: number) {
      if (negate ? value >= expected : !(value >= expected)) {
        throw new Error(`Expected ${negate ? 'not to be at least' : 'to be at least'} ${expected}, but got ${value}`);
      }
      return self;
    },
    lt(expected: number) {
      if (negate ? value < expected : !(value < expected)) {
        throw new Error(`Expected ${negate ? 'not to be below' : 'to be below'} ${expected}, but got ${value}`);
      }
      return self;
    },
    lte(expected: number) {
      if (negate ? value <= expected : !(value <= expected)) {
        throw new Error(`Expected ${negate ? 'not to be at most' : 'to be at most'} ${expected}, but got ${value}`);
      }
      return self;
    },
    length(expected: number) {
      const actual = (value as any)?.length ?? value;
      if (negate ? actual === expected : actual !== expected) {
        throw new Error(`Expected ${negate ? 'not to have' : 'to have'} length ${expected}, but got ${actual}`);
      }
      return self;
    },
    match(pattern: RegExp) {
      const matches = pattern.test(value);
      if (negate ? matches : !matches) {
        throw new Error(`Expected ${negate ? 'not to match' : 'to match'} ${pattern}, but got ${value}`);
      }
      return self;
    },
    include(substring: string) {
      const includes = typeof value === 'string' && value.includes(substring);
      if (negate ? includes : !includes) {
        throw new Error(`Expected ${negate ? 'not to include' : 'to include'} "${substring}" in "${value}"`);
      }
      return self;
    },
  };
  return self;
}

function createCypressCompat(playwrightConfig?: any) {
  return {
    get browser(): any {
      const cy = (globalThis as any).cy;
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

    config: (attr?: string): any => {
      if (!attr) {
        return playwrightConfig;
      }

      const configMap: { [key: string]: string } = {
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
        const parentValue = (playwrightConfig.use as any)?.[parent];
        return parentValue?.[child];
      }

      return (playwrightConfig.use as any)?.[pwAttr];
    },

    log: (options: any): void => {
      const consoleProps = options.consoleProps ? options.consoleProps() : {};
      console.log(`[Cypress.log] ${options.name || ''}`, consoleProps);
    },

    Commands: {
      add(name: string, optionsOrFn: any, fn?: (...args: any[]) => any): void {
        const actualFn = typeof optionsOrFn === 'function' ? optionsOrFn : fn;
        const options = typeof optionsOrFn === 'object' ? optionsOrFn : undefined;
        if (!actualFn) return;
        (globalThis as any).__cypressCustomCommands = (globalThis as any).__cypressCustomCommands || {};
        (globalThis as any).__cypressCustomCommands[name] = actualFn;
        (globalThis as any).__cypressCustomCommandOptions = (globalThis as any).__cypressCustomCommandOptions || {};
        (globalThis as any).__cypressCustomCommandOptions[name] = options;
      },
      overwrite(name: string, fn: (...args: any[]) => any): void {
        (globalThis as any).__cypressCustomCommands = (globalThis as any).__cypressCustomCommands || {};
        (globalThis as any).__cypressOriginalCommands = (globalThis as any).__cypressOriginalCommands || {};
        (globalThis as any).__cypressOriginalCommands[name] = (globalThis as any).__cypressCustomCommands[name] || null;
        (globalThis as any).__cypressCustomCommands[name] = fn;
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
export function setupCypressGlobals(playwrightConfig?: any): void {
  if ((globalThis as any).__cypressGlobalsSetup) return;
  (globalThis as any).__cypressGlobalsSetup = true;

  (globalThis as any).expect = (value: any) => createAssertion(value);

  (globalThis as any).describe = pwDescribe;
  (globalThis as any).context = pwContext;
  (globalThis as any).it = pwIt;
  (globalThis as any).before = pwBefore;
  (globalThis as any).after = pwAfter;
  (globalThis as any).beforeEach = pwBeforeEach;
  (globalThis as any).afterEach = pwAfterEach;
  (globalThis as any).xdescribe = pwXdescribe;
  (globalThis as any).xit = pwXit;

  (globalThis as any).Cypress = createCypressCompat(playwrightConfig);
}
