"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandTranslatorTraversal = void 0;
const selection_1 = require("./selection");
class CommandTranslatorTraversal extends selection_1.CommandTranslatorSelection {
    constructor(page, context) {
        super(page, context);
        Object.assign(this.methodMap, {
            parent: this.parent.bind(this),
            closest: this.closest.bind(this),
            next: this.next.bind(this),
            prev: this.prev.bind(this),
            nextAll: this.nextAll.bind(this),
            prevAll: this.prevAll.bind(this),
            siblings: this.siblings.bind(this),
            children: this.children.bind(this),
            parents: this.parents.bind(this),
            parentsUntil: this.parentsUntil.bind(this),
            not: this.not.bind(this),
            is: this.is.bind(this),
            has: this.has.bind(this),
            filter: this.filter.bind(this),
        });
    }
    async parent() {
        if (!this.currentSubject)
            return null;
        if (this.currentSubject.__playwrightLocator) {
            return this.createJQueryWrapper(this.currentSubject.__playwrightLocator.locator('..'));
        }
        else if (this.currentSubject.__jquery) {
            const parentElement = this.currentSubject.__jquery.parentElement;
            return parentElement ? this.createJQueryWrapper(parentElement) : null;
        }
        else if (this.currentSubject instanceof HTMLElement) {
            const parentElement = this.currentSubject.parentElement;
            return parentElement ? this.createJQueryWrapper(parentElement) : null;
        }
        return null;
    }
    async closest(selector) {
        if (!this.currentSubject)
            return null;
        const locator = this.currentSubject.__playwrightLocator || this.currentSubject;
        if (locator.locator) {
            return this.createJQueryWrapper(locator.locator(`xpath=./ancestor::*[${selector}]`).first());
        }
        return null;
    }
    async next() {
        if (!this.currentSubject)
            return null;
        const locator = this.currentSubject.__playwrightLocator || this.currentSubject;
        if (locator.locator) {
            return this.createJQueryWrapper(locator.locator('xpath=following-sibling::*').first());
        }
        return null;
    }
    async prev() {
        if (!this.currentSubject)
            return null;
        const locator = this.currentSubject.__playwrightLocator || this.currentSubject;
        if (locator.locator) {
            return this.createJQueryWrapper(locator.locator('xpath=preceding-sibling::*').first());
        }
        return null;
    }
    async nextAll() {
        if (!this.currentSubject)
            return null;
        const locator = this.currentSubject.__playwrightLocator || this.currentSubject;
        if (locator.locator) {
            return this.createJQueryWrapper(locator.locator('xpath=following-sibling::*'));
        }
        return null;
    }
    async prevAll() {
        if (!this.currentSubject)
            return null;
        const locator = this.currentSubject.__playwrightLocator || this.currentSubject;
        if (locator.locator) {
            return this.createJQueryWrapper(locator.locator('xpath=preceding-sibling::*'));
        }
        return null;
    }
    async siblings() {
        if (!this.currentSubject)
            return null;
        const locator = this.currentSubject.__playwrightLocator || this.currentSubject;
        if (locator.locator) {
            return this.createJQueryWrapper(locator.locator('xpath=following-sibling::* | preceding-sibling::*'));
        }
        return null;
    }
    async children(selector) {
        if (!this.currentSubject)
            return null;
        const locator = this.currentSubject.__playwrightLocator || this.currentSubject;
        if (locator.locator) {
            const childLocator = selector ? locator.locator(selector) : locator.locator('xpath=./*');
            return this.createJQueryWrapper(childLocator);
        }
        return null;
    }
    async parents(selector) {
        if (!this.currentSubject)
            return null;
        const locator = this.currentSubject.__playwrightLocator || this.currentSubject;
        if (locator.locator) {
            const parentLocator = selector
                ? locator.locator(`xpath=./ancestor::*[${selector}]`)
                : locator.locator('xpath=./ancestor::*');
            return this.createJQueryWrapper(parentLocator);
        }
        return null;
    }
    async parentsUntil(selector) {
        if (!this.currentSubject)
            return null;
        const locator = this.currentSubject.__playwrightLocator || this.currentSubject;
        if (locator.locator) {
            return this.createJQueryWrapper(locator.locator(`xpath=./ancestor::*[not(${selector})]`));
        }
        return null;
    }
    async not(selector) {
        if (!this.currentSubject)
            return null;
        const locator = this.currentSubject.__playwrightLocator || this.currentSubject;
        if (locator.filter) {
            // Use Playwright's filter with CSS :not() pseudo-class
            return this.createJQueryWrapper(locator.filter(`:not(${selector})`));
        }
        return null;
    }
    async is(selector) {
        if (!this.currentSubject)
            return false;
        const locator = this.currentSubject.__playwrightLocator || this.currentSubject;
        if (locator.locator) {
            const count = await locator.locator(selector).count();
            return count > 0;
        }
        return false;
    }
    async has(selector) {
        if (!this.currentSubject)
            return null;
        const locator = this.currentSubject.__playwrightLocator || this.currentSubject;
        if (locator.locator) {
            return this.createJQueryWrapper(locator.locator(selector));
        }
        return null;
    }
    async filter(selectorOrFn) {
        // Filter elements in the current subject
        if (!this.currentSubject) {
            throw new Error('filter() requires a subject (use get, find, etc. first)');
        }
        // Get the Playwright locator
        const locator = this.currentSubject.__playwrightLocator || this.currentSubject;
        if (typeof selectorOrFn === 'string') {
            // Handle special jQuery pseudo-selectors
            // Remove :visible and use Playwright's filter instead
            if (selectorOrFn === ':visible' || selectorOrFn.includes(':visible')) {
                // Extract the base selector if there's one before :visible
                const baseSelector = selectorOrFn.replace(':visible', '').trim() || '*';
                const baseLocator = baseSelector === '*' ? locator : locator.locator(baseSelector);
                const filteredLocator = baseLocator.filter({ visible: true });
                return this.createJQueryWrapper(filteredLocator);
            }
            if (selectorOrFn === ':hidden') {
                const filteredLocator = locator.filter({ visible: false });
                return this.createJQueryWrapper(filteredLocator);
            }
            if (selectorOrFn === ':first') {
                return this.createJQueryWrapper(locator.first());
            }
            if (selectorOrFn === ':last') {
                return this.createJQueryWrapper(locator.last());
            }
            // Filter by selector string using Playwright's filter()
            const filteredLocator = locator.filter(selectorOrFn);
            return this.createJQueryWrapper(filteredLocator);
        }
        else if (typeof selectorOrFn === 'function') {
            // Filter by predicate function
            // Playwright doesn't support predicate functions directly, so we need to evaluate
            const elements = await locator.all();
            const filteredElements = [];
            for (const element of elements) {
                const result = await selectorOrFn(element);
                if (result) {
                    filteredElements.push(element);
                }
            }
            // Return the first filtered element wrapped
            if (filteredElements.length > 0) {
                return this.createJQueryWrapper(locator.first());
            }
            return this.createJQueryWrapper(locator);
        }
        return this.currentSubject;
    }
}
exports.CommandTranslatorTraversal = CommandTranslatorTraversal;
