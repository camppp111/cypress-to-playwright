"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.xit = exports.xdescribe = exports.afterEach = exports.beforeEach = exports.after = exports.before = exports.it = exports.context = exports.describe = exports.mochaTranslator = exports.MochaTranslator = void 0;
const test_1 = require("@playwright/test");
const index_1 = require("./index");
class MochaTranslator {
    constructor() {
        this.testTitleMap = new Map();
    }
    describe(name, optionsOrCallback, callback) {
        const actualCallback = callback || optionsOrCallback;
        const options = callback ? optionsOrCallback : {};
        test_1.test.describe(name, options, () => {
            test_1.test.describe.configure({ timeout: 120000 });
            // Set up a dummy cy for describe-level calls to prevent errors
            // These calls will be ignored since they're not in an actual test context
            const originalCy = globalThis.cy;
            if (!originalCy) {
                globalThis.cy = {
                    get: () => ({ should: () => ({}), and: () => ({}) }),
                    visit: () => ({}),
                    intercept: () => ({}),
                    should: () => ({}),
                    and: () => ({}),
                };
            }
            try {
                actualCallback({});
            }
            catch (e) {
                // Ignore errors from describe-level calls
            }
            // Restore original cy if it was set
            if (!originalCy) {
                delete globalThis.cy;
            }
        });
    }
    context(name, optionsOrCallback, callback) {
        const actualCallback = callback || optionsOrCallback;
        test_1.test.describe(name, actualCallback);
    }
    it(name, optionsOrCallback, callback) {
        const actualCallback = callback || optionsOrCallback;
        const options = callback ? optionsOrCallback : {};
        // Handle duplicate test titles by adding a suffix
        let testName = name;
        const count = this.testTitleMap.get(name) || 0;
        if (count > 0) {
            testName = `${name} (${count})`;
        }
        this.testTitleMap.set(name, count + 1);
        (0, test_1.test)(testName, options, async ({ page }) => {
            // Set up cy with the current Playwright page fixture
            globalThis.cy = (0, index_1.setupCypressToPlaywright)(page);
            const result = actualCallback({});
            if (result && typeof result.then === 'function') {
                await result;
            }
            // Wait for all commands to complete
            const proxy = globalThis.__cypressCommandProxy;
            if (proxy && typeof proxy.flush === 'function') {
                await proxy.flush();
            }
        });
    }
    before(callback) {
        test_1.test.beforeAll(async ({ page }) => {
            globalThis.cy = (0, index_1.setupCypressToPlaywright)(page);
            const result = callback({});
            if (result && typeof result.then === 'function') {
                await result;
            }
            const proxy = globalThis.__cypressCommandProxy;
            if (proxy && typeof proxy.flush === 'function') {
                await proxy.flush();
            }
        });
    }
    after(callback) {
        test_1.test.afterAll(async ({ page }) => {
            globalThis.cy = (0, index_1.setupCypressToPlaywright)(page);
            const result = callback({});
            if (result && typeof result.then === 'function') {
                await result;
            }
            const proxy = globalThis.__cypressCommandProxy;
            if (proxy && typeof proxy.flush === 'function') {
                await proxy.flush();
            }
        });
    }
    beforeEach(callback) {
        test_1.test.beforeEach(async ({ page }) => {
            globalThis.cy = (0, index_1.setupCypressToPlaywright)(page);
            const result = callback({});
            if (result && typeof result.then === 'function') {
                await result;
            }
            const proxy = globalThis.__cypressCommandProxy;
            if (proxy && typeof proxy.flush === 'function') {
                await proxy.flush();
            }
        });
    }
    afterEach(callback) {
        test_1.test.afterEach(async ({ page }) => {
            globalThis.cy = (0, index_1.setupCypressToPlaywright)(page);
            const result = callback({});
            if (result && typeof result.then === 'function') {
                await result;
            }
            const proxy = globalThis.__cypressCommandProxy;
            if (proxy && typeof proxy.flush === 'function') {
                await proxy.flush();
            }
        });
    }
    xdescribe(name, optionsOrCallback, callback) {
        const actualCallback = callback || optionsOrCallback;
        const options = callback ? optionsOrCallback : {};
        test_1.test.describe.skip(name, options, actualCallback);
    }
    xit(name, optionsOrCallback, callback) {
        const actualCallback = callback || optionsOrCallback;
        const options = callback ? optionsOrCallback : {};
        test_1.test.skip(name, options, actualCallback);
    }
    expect(value) {
        test_1.test.expect(value);
    }
}
exports.MochaTranslator = MochaTranslator;
exports.mochaTranslator = new MochaTranslator();
exports.describe = exports.mochaTranslator.describe.bind(exports.mochaTranslator);
exports.context = exports.mochaTranslator.context.bind(exports.mochaTranslator);
exports.it = exports.mochaTranslator.it.bind(exports.mochaTranslator);
exports.before = exports.mochaTranslator.before.bind(exports.mochaTranslator);
exports.after = exports.mochaTranslator.after.bind(exports.mochaTranslator);
exports.beforeEach = exports.mochaTranslator.beforeEach.bind(exports.mochaTranslator);
exports.afterEach = exports.mochaTranslator.afterEach.bind(exports.mochaTranslator);
exports.xdescribe = exports.mochaTranslator.xdescribe.bind(exports.mochaTranslator);
exports.xit = exports.mochaTranslator.xit.bind(exports.mochaTranslator);
