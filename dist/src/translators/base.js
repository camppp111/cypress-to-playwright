"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandTranslatorBase = void 0;
const SPECIAL_KEY_MAP = {
    '{enter}': 'Enter',
    '{esc}': 'Escape',
    '{tab}': 'Tab',
    '{backspace}': 'Backspace',
    '{delete}': 'Delete',
    '{arrowup}': 'ArrowUp',
    '{arrowdown}': 'ArrowDown',
    '{arrowleft}': 'ArrowLeft',
    '{arrowright}': 'ArrowRight',
    '{home}': 'Home',
    '{end}': 'End',
    '{pageup}': 'PageUp',
    '{pagedown}': 'PageDown',
};
class CommandTranslatorBase {
    constructor(page, context) {
        this.withinSubjectChain = [];
        this.requestAliases = new Map();
        this.lastInterceptId = '';
        this.methodMap = {};
        this.nonSubjectCommands = ['request', 'log', 'click', 'wait'];
        this.context = { page, context };
    }
    async translate(command, args, chainSubject) {
        // If a subject is passed from the chain, set it as currentSubject before executing
        if (chainSubject !== undefined) {
            this.currentSubject = chainSubject;
        }
        const method = this.getPlaywrightMethod(command);
        if (!method) {
            throw new Error(`Unknown Cypress command: ${command}`);
        }
        const result = await method.call(this, ...args);
        // Commands that don't yield a new subject preserve the current subject
        if (!this.nonSubjectCommands.includes(command)) {
            this.currentSubject = result;
        }
        return result;
    }
    getCurrentSubject() {
        return this.currentSubject;
    }
    getPlaywrightMethod(command) {
        return this.methodMap[command] || null;
    }
    getLocator(selector) {
        if (this.withinSubjectChain.length > 0) {
            return this.withinSubjectChain[this.withinSubjectChain.length - 1].locator(selector);
        }
        return this.context.page.locator(selector);
    }
    async createJQueryWrapper(element, forceSingle = false) {
        // Check if this is a collection (multiple elements) or single element
        let isCollection = false;
        if (!forceSingle) {
            // When forceSingle is false, always treat as collection for findAll methods
            isCollection = true;
        }
        else {
            try {
                // Try to count - if it throws or returns > 1, it's potentially a collection
                const count = await element.count?.() ?? 1;
                isCollection = count > 1;
            }
            catch {
                // If count() fails, assume single element
                isCollection = false;
            }
        }
        // For collections, return a lightweight wrapper without pre-fetching
        // Individual elements will be wrapped when accessed via eq() or each()
        if (isCollection) {
            return {
                // Async methods for collection elements - these require await when used
                prop: async (name) => {
                    try {
                        const first = await element.first();
                        return await first.evaluate((el, propName) => el[propName], name);
                    }
                    catch (error) {
                        if (error.message && error.message.includes('Test ended')) {
                            return undefined;
                        }
                        throw error;
                    }
                },
                attr: async (name) => {
                    try {
                        const first = await element.first();
                        return await first.evaluate((el, attrName) => el.getAttribute(attrName), name);
                    }
                    catch (error) {
                        if (error.message && error.message.includes('Test ended')) {
                            return null;
                        }
                        throw error;
                    }
                },
                text: async () => {
                    try {
                        const first = await element.first();
                        return await first.textContent();
                    }
                    catch (error) {
                        if (error.message && error.message.includes('Test ended')) {
                            return '';
                        }
                        throw error;
                    }
                },
                // Collection methods
                eq: async (index) => {
                    const nthElement = element.nth(index);
                    return this.createJQueryWrapper(nthElement, true);
                },
                each: async (callback) => {
                    const count = await element.count();
                    for (let i = 0; i < count; i++) {
                        const wrapped = await this.createJQueryWrapper(element.nth(i), true);
                        await callback(wrapped, i);
                    }
                },
                first: async () => this.createJQueryWrapper(element.first(), true),
                last: async () => this.createJQueryWrapper(element.last(), true),
                // Pass through to underlying Playwright locator
                __playwrightLocator: element,
                __isCollection: true,
                click: async () => element.first().click(),
                count: async () => element.count(),
            };
        }
        // Single element - pre-fetch data for synchronous access
        let elementData;
        if (typeof element.evaluate === 'function') {
            // Playwright locator
            try {
                elementData = await element.evaluate((el) => ({
                    href: el.href || undefined,
                    src: el.src || undefined,
                    textContent: el.textContent,
                    innerText: el.innerText,
                    innerHTML: el.innerHTML,
                    value: el.value || undefined,
                }));
            }
            catch {
                // Element doesn't exist or isn't attached to DOM
                elementData = {
                    href: undefined,
                    src: undefined,
                    textContent: undefined,
                    innerText: undefined,
                    innerHTML: undefined,
                    value: undefined,
                };
            }
        }
        else {
            // Plain DOM element
            elementData = {
                href: element.href || undefined,
                src: element.src || undefined,
                textContent: element.textContent,
                innerText: element.innerText,
                innerHTML: element.innerHTML,
                value: element.value || undefined,
            };
        }
        // Build attributes map
        const attributes = {};
        let attrNames = [];
        if (typeof element.evaluate === 'function') {
            try {
                attrNames = await element.evaluate((el) => {
                    return Array.from(el.attributes).map((a) => a.name);
                });
                for (const name of attrNames) {
                    try {
                        attributes[name] = await element.evaluate((el, n) => el.getAttribute(n), name);
                    }
                    catch {
                        attributes[name] = null;
                    }
                }
            }
            catch {
                attrNames = [];
            }
        }
        else {
            // Plain DOM element
            if (element.attributes) {
                attrNames = Array.from(element.attributes).map((a) => a.name);
                for (const name of attrNames) {
                    attributes[name] = element.getAttribute(name);
                }
            }
        }
        // Create a minimal jQuery-like wrapper with synchronous prop() and attr()
        const wrapper = {
            prop: (name) => {
                // Check pre-fetched properties first, then fall back to attributes
                let value = elementData[name];
                if (value !== undefined) {
                    // For href, return absolute URL like jQuery does
                    if (name === 'href' && typeof value === 'string' && !value.startsWith('http') && value) {
                        const base = this.context.page.url();
                        try {
                            return new URL(value, base).href;
                        }
                        catch (error) {
                            console.error('Error creating absolute URL:', error);
                            return value;
                        }
                    }
                    return value;
                }
                // Fall back to attributes map
                value = attributes[name];
                if (value !== undefined) {
                    // For href, return absolute URL like jQuery does
                    if (name === 'href' && typeof value === 'string' && !value.startsWith('http') && value) {
                        const base = this.context.page.url();
                        try {
                            return new URL(value, base).href;
                        }
                        catch (error) {
                            console.error('Error creating absolute URL:', error);
                        }
                        return value;
                    }
                    return value;
                }
                // For href, return current page URL as fallback to avoid Invalid URL error
                if (name === 'href') {
                    const pageUrl = this.context.page.url();
                    // Ensure the page URL is valid, otherwise return a placeholder
                    if (pageUrl && typeof pageUrl === 'string') {
                        try {
                            new URL(pageUrl);
                            return pageUrl;
                        }
                        catch {
                            // Page URL is invalid, return a placeholder
                            return 'http://example.com';
                        }
                    }
                    // No page URL available, return a placeholder
                    return 'http://example.com';
                }
                return undefined;
            },
            attr: (name) => {
                // Check attributes map first
                let value = attributes[name];
                if (value !== undefined && typeof value === 'string') {
                    return value;
                }
                // Fallback: get attribute directly from element
                if (typeof element.getAttribute === 'function') {
                    value = element.getAttribute(name);
                    if (value !== null && typeof value === 'string') {
                        // For href from getAttribute, return absolute URL like jQuery does
                        if (name === 'href' && typeof value === 'string' && !value.startsWith('http')) {
                            const base = this.context.page.url();
                            try {
                                return new URL(value, base).href;
                            }
                            catch (error) {
                                console.error('Error creating absolute URL:', error);
                                return value;
                            }
                        }
                        return value;
                    }
                }
                // Final fallback for href: return empty string to avoid indexOf errors
                if (name === 'href') {
                    return '';
                }
                return undefined;
            },
            text: () => elementData.textContent || elementData.innerText,
            click: () => element.click(),
        };
        // Only set __playwrightLocator if element is actually a Playwright locator
        if (typeof element.evaluate === 'function') {
            wrapper.__playwrightLocator = element;
        }
        return wrapper;
    }
    async typeText(locator, text) {
        const specialKeyPattern = /^\{[a-zA-Z]+\}$/;
        if (specialKeyPattern.test(text)) {
            const key = SPECIAL_KEY_MAP[text.toLowerCase()] || text.replace(/[{}]/g, '');
            await locator.press(key);
            return;
        }
        const mixedPattern = /\{[a-zA-Z]+\}/;
        if (mixedPattern.test(text)) {
            const parts = text.split(mixedPattern);
            const keys = text.match(mixedPattern) || [];
            for (let i = 0; i < parts.length; i++) {
                if (parts[i])
                    await locator.type(parts[i]);
                if (keys[i]) {
                    const key = SPECIAL_KEY_MAP[keys[i].toLowerCase()] || keys[i].replace(/[{}]/g, '');
                    await locator.press(key);
                }
            }
        }
        else {
            await locator.type(text);
        }
    }
    isHttpMethod(value) {
        return ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'].includes(value.toUpperCase());
    }
}
exports.CommandTranslatorBase = CommandTranslatorBase;
