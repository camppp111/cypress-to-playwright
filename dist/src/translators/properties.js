"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandTranslatorProperties = void 0;
const playwright_config_1 = __importDefault(require("../../playwright.config"));
const assertions_1 = require("./assertions");
class CommandTranslatorProperties extends assertions_1.CommandTranslatorAssertions {
    constructor(page, context) {
        super(page, context);
        Object.assign(this.methodMap, {
            its: this.its.bind(this),
            hasClass: this.hasClass.bind(this),
            length: this.length.bind(this),
            prop: this.prop.bind(this),
            invoke: this.invoke.bind(this),
            wrap: this.wrap.bind(this),
            config: this.config.bind(this),
        });
    }
    async its(property) {
        if (!this.currentSubject)
            return undefined;
        if (property === 'length') {
            // Only apply Playwright locator count for actual Playwright locators
            if (this.currentSubject.__playwrightLocator) {
                return await this.currentSubject.__playwrightLocator.count();
            }
            if (this.currentSubject.locator && typeof this.currentSubject.count === 'function') {
                return await this.currentSubject.count();
            }
            // Fall through to normal property access for arrays/objects
        }
        // Support dot-notation paths like 'nested.value' or 'location.href'
        const path = property.split('.');
        if (this.currentSubject.__playwrightLocator) {
            return await this.currentSubject.__playwrightLocator.evaluate((el, propPath) => propPath.reduce((obj, key) => obj?.[key], el), path);
        }
        return path.reduce((obj, key) => obj?.[key], this.currentSubject);
    }
    async hasClass(className) {
        if (!this.currentSubject)
            return false;
        const locator = this.currentSubject.__playwrightLocator || this.currentSubject;
        if (locator.locator) {
            return await locator.evaluate((el, className) => {
                return el.classList.contains(className);
            }, className);
        }
        return false;
    }
    async length() {
        if (!this.currentSubject)
            return 0;
        const locator = this.currentSubject.__playwrightLocator || this.currentSubject;
        if (locator.locator) {
            return await locator.count();
        }
        return 0;
    }
    async prop(propertyName) {
        // Get a property from the current subject (jQuery-compatible)
        // Used for things like $link.prop('href')
        if (!this.currentSubject) {
            throw new Error('prop() requires a subject');
        }
        // If subject is a Playwright locator, get the property via evaluate
        if (this.currentSubject.evaluate) {
            return this.currentSubject.evaluate((el, prop) => el[prop], propertyName);
        }
        // Fallback for plain objects
        return this.currentSubject[propertyName];
    }
    async invoke(method, ...args) {
        const methodMap = {
            removeAttr: 'removeAttribute',
            attr: 'getAttribute',
            prop: 'getAttribute',
            val: 'value',
            text: 'textContent',
            html: 'innerHTML',
        };
        const domMethod = methodMap[method] || method;
        const locator = this.currentSubject.__playwrightLocator || this.currentSubject;
        const result = await locator.evaluate((el, data) => {
            const fn = el[data.method];
            if (typeof fn === 'function') {
                return fn.call(el, ...data.args);
            }
            return el[data.method];
        }, { method: domMethod, args });
        const isPropertyAccess = ['attr', 'prop', 'val', 'text', 'html'].includes(method);
        if (isPropertyAccess) {
            return result;
        }
        return result !== undefined ? result : this.currentSubject;
    }
    async wrap(value, _options) {
        // If value is already our jQuery-like wrapper (has __playwrightLocator), preserve it
        if (value && value.__playwrightLocator) {
            return value;
        }
        // If value is a Playwright locator, wrap it with jQuery-like interface
        if (value && value.evaluate) {
            return this.createJQueryWrapper(value);
        }
        // Return the value wrapped in a promise to match Cypress chainable behavior
        // This ensures the value is passed to subsequent .then() calls
        return Promise.resolve(value);
    }
    config(attr) {
        if (!attr) {
            return playwright_config_1.default;
        }
        // Map Cypress config attributes to Playwright equivalents
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
        // Handle nested attributes like 'viewport.width'
        if (pwAttr.includes('.')) {
            const [parent, child] = pwAttr.split('.');
            const parentValue = playwright_config_1.default.use?.[parent];
            return parentValue?.[child];
        }
        return playwright_config_1.default.use?.[pwAttr];
    }
}
exports.CommandTranslatorProperties = CommandTranslatorProperties;
