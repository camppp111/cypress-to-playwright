import { test } from '@playwright/test';
import { setupCypressToPlaywright } from './index';

export class MochaTranslator {
  private testTitleMap = new Map<string, number>();

  describe(name: string, callback: (fixtures?: any) => void | Promise<void>): void;
  describe(name: string, options: any, callback: (fixtures?: any) => void | Promise<void>): void;
  describe(name: string, optionsOrCallback: any, callback?: (fixtures?: any) => void | Promise<void>): void {
    const actualCallback = callback || optionsOrCallback;
    const options = callback ? optionsOrCallback : {};
    test.describe(name, options, () => {
      test.describe.configure({ timeout: 120000 });
      
      // Set up a dummy cy for describe-level calls to prevent errors
      // These calls will be ignored since they're not in an actual test context
      const originalCy = (globalThis as any).cy;
      if (!originalCy) {
        (globalThis as any).cy = {
          get: () => ({ should: () => ({}), and: () => ({}) }),
          visit: () => ({}),
          intercept: () => ({}),
          should: () => ({}),
          and: () => ({}),
        };
      }
      
      try {
        actualCallback({});
      } catch (e) {
        // Ignore errors from describe-level calls
      }
      
      // Restore original cy if it was set
      if (!originalCy) {
        delete (globalThis as any).cy;
      }
    });
  }

  context(name: string, callback: (fixtures?: any) => void | Promise<void>): void;
  context(name: string, options: any, callback: (fixtures?: any) => void | Promise<void>): void;
  context(name: string, optionsOrCallback: any, callback?: (fixtures?: any) => void | Promise<void>): void {
    const actualCallback = callback || optionsOrCallback;
    test.describe(name, actualCallback);
  }

  it(name: string, callback: (fixtures?: any) => void | Promise<void>): void;
  it(name: string, options: any, callback: (fixtures?: any) => void | Promise<void>): void;
  it(name: string, optionsOrCallback: any, callback?: (fixtures?: any) => void | Promise<void>): void {
    const actualCallback = callback || optionsOrCallback;
    const options = callback ? optionsOrCallback : {};
    
    // Handle duplicate test titles by adding a suffix
    let testName = name;
    const count = this.testTitleMap.get(name) || 0;
    if (count > 0) {
      testName = `${name} (${count})`;
    }
    this.testTitleMap.set(name, count + 1);
    
    test(testName, options, async ({ page }) => {
      // Set up cy with the current Playwright page fixture
      (globalThis as any).cy = setupCypressToPlaywright(page);
      const result = actualCallback({});
      if (result && typeof result.then === 'function') {
        await result;
      }
      // Wait for all commands to complete
      const proxy = (globalThis as any).__cypressCommandProxy;
      if (proxy && typeof proxy.flush === 'function') {
        await proxy.flush();
      }
    });
  }

  before(callback: (fixtures?: any) => void | Promise<void>): void {
    test.beforeAll(async ({ page }) => {
      (globalThis as any).cy = setupCypressToPlaywright(page);
      const result = callback({});
      if (result && typeof result.then === 'function') {
        await result;
      }
      const proxy = (globalThis as any).__cypressCommandProxy;
      if (proxy && typeof proxy.flush === 'function') {
        await proxy.flush();
      }
    });
  }

  after(callback: (fixtures?: any) => void | Promise<void>): void {
    test.afterAll(async ({ page }) => {
      (globalThis as any).cy = setupCypressToPlaywright(page);
      const result = callback({});
      if (result && typeof result.then === 'function') {
        await result;
      }
      const proxy = (globalThis as any).__cypressCommandProxy;
      if (proxy && typeof proxy.flush === 'function') {
        await proxy.flush();
      }
    });
  }

  beforeEach(callback: (fixtures?: any) => void | Promise<void>): void {
    test.beforeEach(async ({ page }) => {
      (globalThis as any).cy = setupCypressToPlaywright(page);
      const result = callback({});
      if (result && typeof result.then === 'function') {
        await result;
      }
      const proxy = (globalThis as any).__cypressCommandProxy;
      if (proxy && typeof proxy.flush === 'function') {
        await proxy.flush();
      }
    });
  }

  afterEach(callback: (fixtures?: any) => void | Promise<void>): void {
    test.afterEach(async ({ page }) => {
      (globalThis as any).cy = setupCypressToPlaywright(page);
      const result = callback({});
      if (result && typeof result.then === 'function') {
        await result;
      }
      const proxy = (globalThis as any).__cypressCommandProxy;
      if (proxy && typeof proxy.flush === 'function') {
        await proxy.flush();
      }
    });
  }

  xdescribe(name: string, callback: (fixtures?: any) => void | Promise<void>): void;
  xdescribe(name: string, options: any, callback: (fixtures?: any) => void | Promise<void>): void;
  xdescribe(name: string, optionsOrCallback: any, callback?: (fixtures?: any) => void | Promise<void>): void {
    const actualCallback = callback || optionsOrCallback;
    const options = callback ? optionsOrCallback : {};
    test.describe.skip(name, options, actualCallback);
  }

  xit(name: string, callback: (fixtures?: any) => void | Promise<void>): void;
  xit(name: string, options: any, callback: (fixtures?: any) => void | Promise<void>): void;
  xit(name: string, optionsOrCallback: any, callback?: (fixtures?: any) => void | Promise<void>): void {
    const actualCallback = callback || optionsOrCallback;
    const options = callback ? optionsOrCallback : {};
    test.skip(name, options, actualCallback);
  }

  expect(value: any): any {
    test.expect(value);
  }
}

export const mochaTranslator = new MochaTranslator();

type DescribeFn = {
  (name: string, callback: (fixtures?: any) => void | Promise<void>): void;
  (name: string, options: any, callback: (fixtures?: any) => void | Promise<void>): void;
};

export const describe: DescribeFn = mochaTranslator.describe.bind(mochaTranslator) as any;

type ContextFn = {
  (name: string, callback: (fixtures?: any) => void | Promise<void>): void;
  (name: string, options: any, callback: (fixtures?: any) => void | Promise<void>): void;
};

type ItFn = {
  (name: string, callback: (fixtures?: any) => void | Promise<void>): void;
  (name: string, options: any, callback: (fixtures?: any) => void | Promise<void>): void;
};

export const context: ContextFn = mochaTranslator.context.bind(mochaTranslator) as any;
export const it: ItFn = mochaTranslator.it.bind(mochaTranslator) as any;
export const before = mochaTranslator.before.bind(mochaTranslator);
export const after = mochaTranslator.after.bind(mochaTranslator);
export const beforeEach = mochaTranslator.beforeEach.bind(mochaTranslator);
export const afterEach = mochaTranslator.afterEach.bind(mochaTranslator);
export const xdescribe = mochaTranslator.xdescribe.bind(mochaTranslator) as any;
export const xit = mochaTranslator.xit.bind(mochaTranslator) as any;
