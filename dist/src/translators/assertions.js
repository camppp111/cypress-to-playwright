"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandTranslatorAssertions = void 0;
const traversal_1 = require("./traversal");
class CommandTranslatorAssertions extends traversal_1.CommandTranslatorTraversal {
    constructor(page, context) {
        super(page, context);
        Object.assign(this.methodMap, {
            should: this.should.bind(this),
            and: this.and.bind(this),
        });
    }
    async should(assertion, valueOrExpected, expectedValue) {
        const subject = this.currentSubject;
        // Parse assertion to extract negate flag and parts
        const assertionParts = assertion.split('.');
        let negate = assertionParts[0] === 'not';
        let mainAssertion = negate ? assertionParts[1] : assertionParts[0];
        let subAssertion = assertionParts[negate ? 2 : 1];
        let extraParam = assertionParts[negate ? 3 : 2]; // For "have.attr.href"
        let expected = valueOrExpected;
        let expectedValueCheck = expectedValue;
        // Retry logic for assertions (Cypress-like behavior)
        const retryAssertion = async (handler) => {
            const timeout = 4000;
            const interval = 100;
            const startTime = Date.now();
            let lastError;
            while (Date.now() - startTime < timeout) {
                try {
                    await handler(subject, expected, expectedValueCheck, negate);
                    return; // Assertion passed
                }
                catch (error) {
                    lastError = error;
                    await new Promise(resolve => setTimeout(resolve, interval));
                }
            }
            throw lastError;
        };
        // Assertion handlers
        const handlers = {
            eq: async (subj, exp) => {
                const matches = subj === exp;
                if (negate ? matches : !matches) {
                    throw new Error(`Expected ${subj} to ${negate ? 'not ' : ''}equal ${exp}`);
                }
            },
            equal: async (subj, exp) => {
                // Alias for eq - strict equality
                const matches = subj === exp;
                if (negate ? matches : !matches) {
                    throw new Error(`Expected ${subj} to ${negate ? 'not ' : ''}equal ${exp}`);
                }
            },
            a: async (subj, type) => {
                let matches = false;
                const actual = typeof subj;
                if (type === 'null') {
                    matches = subj === null;
                }
                else if (type === 'undefined') {
                    matches = subj === undefined;
                }
                else if (type === 'array') {
                    matches = Array.isArray(subj);
                }
                else if (type === 'object') {
                    matches = subj !== null && typeof subj === 'object' && !Array.isArray(subj);
                }
                else if (type === 'string' || type === 'number' || type === 'boolean' || type === 'function' || type === 'symbol' || type === 'bigint') {
                    matches = actual === type;
                }
                else {
                    // For custom constructors, check instanceof
                    const ctor = globalThis[type] || window?.[type];
                    if (ctor) {
                        matches = subj instanceof ctor;
                    }
                }
                if (negate ? matches : !matches) {
                    throw new Error(`Expected ${subj} to ${negate ? 'not ' : ''}be a(n) ${type}, but got ${actual}`);
                }
            },
            an: async (subj, type) => {
                // Alias for 'a'
                const handler = handlers.a;
                if (handler) {
                    await handler(subj, type, undefined, negate);
                }
            },
            exist: async (subj) => {
                const exists = subj && (!subj.__playwrightLocator || (await subj.__playwrightLocator.count()) > 0);
                if (negate ? exists : !exists) {
                    throw new Error(`Expected subject to ${negate ? 'not ' : ''}exist`);
                }
            },
            visible: async (subj) => {
                if (!subj || !subj.__playwrightLocator) {
                    throw new Error(`Expected subject to ${negate ? 'not ' : ''}be visible`);
                }
                const count = await subj.__playwrightLocator.count();
                if (count === 0) {
                    throw new Error(`Expected subject to be visible, but element not found in DOM`);
                }
                const isVisible = await subj.__playwrightLocator.isVisible();
                if (negate ? isVisible : !isVisible) {
                    throw new Error(`Expected subject to ${negate ? 'not ' : ''}be visible`);
                }
                if (!negate) {
                    try {
                        await subj.__playwrightLocator.waitFor({ state: 'visible', timeout: 5000 });
                    }
                    catch (error) {
                        throw new Error(`Expected subject to be visible. Element exists in DOM but waitFor failed`);
                    }
                }
            },
            hidden: async (subj) => {
                if (!subj || !subj.__playwrightLocator) {
                    throw new Error(`Expected subject to ${negate ? 'not ' : ''}be hidden`);
                }
                const isVisible = await subj.__playwrightLocator.isVisible();
                if (negate ? !isVisible : isVisible) {
                    throw new Error(`Expected subject to ${negate ? 'not ' : ''}be hidden, but it is ${isVisible ? 'visible' : 'hidden'}`);
                }
            },
            enabled: async (subj) => {
                if (!subj || !subj.__playwrightLocator) {
                    throw new Error(`Expected subject to be ${negate ? 'not ' : ''}enabled`);
                }
                const isEnabled = await subj.__playwrightLocator.isEnabled();
                if (negate ? isEnabled : !isEnabled) {
                    throw new Error(`Expected subject to be ${negate ? 'not ' : ''}enabled`);
                }
            },
            disabled: async (subj) => {
                if (!subj || !subj.__playwrightLocator) {
                    throw new Error(`Expected subject to be ${negate ? 'not ' : ''}disabled`);
                }
                const isEnabled = await subj.__playwrightLocator.isEnabled();
                if (negate ? !isEnabled : isEnabled) {
                    throw new Error(`Expected subject to be ${negate ? 'not ' : ''}disabled`);
                }
            },
            checked: async (subj) => {
                if (!subj || !subj.__playwrightLocator) {
                    throw new Error(`Expected subject to be ${negate ? 'not ' : ''}checked`);
                }
                const count = await subj.__playwrightLocator.count();
                if (count === 0) {
                    throw new Error(`Expected subject to be ${negate ? 'not ' : ''}checked, but element not found`);
                }
                // Check if it's a checkbox or radio input
                const tagName = await subj.__playwrightLocator.evaluate((el) => el.tagName?.toLowerCase());
                const inputType = await subj.__playwrightLocator.evaluate((el) => el.type?.toLowerCase());
                if (tagName !== 'input' || (inputType !== 'checkbox' && inputType !== 'radio')) {
                    throw new Error(`Expected subject to be a checkbox or radio input for 'checked' assertion`);
                }
                const isChecked = await subj.__playwrightLocator.isChecked();
                if (negate ? isChecked : !isChecked) {
                    throw new Error(`Expected subject to be ${negate ? 'not ' : ''}checked`);
                }
            },
            empty: async (subj) => {
                let isEmpty = false;
                if (typeof subj === 'string') {
                    isEmpty = subj.trim().length === 0;
                }
                else if (Array.isArray(subj)) {
                    isEmpty = subj.length === 0;
                }
                else if (subj && subj.__playwrightLocator) {
                    const text = await subj.__playwrightLocator.textContent() || '';
                    isEmpty = text.trim().length === 0;
                }
                else if (subj && typeof subj === 'object') {
                    isEmpty = Object.keys(subj).length === 0;
                }
                else {
                    isEmpty = !subj;
                }
                if (negate ? isEmpty : !isEmpty) {
                    throw new Error(`Expected subject to be ${negate ? 'not ' : ''}empty`);
                }
            },
            class: async (subj, className) => {
                let hasClass = false;
                if (subj && subj.__playwrightLocator) {
                    hasClass = await subj.__playwrightLocator.evaluate((el, cls) => el.classList.contains(cls), className);
                }
                else if (subj && typeof subj.hasClass === 'function') {
                    hasClass = await subj.hasClass(className);
                }
                if (negate ? hasClass : !hasClass) {
                    throw new Error(`Expected element to ${negate ? 'not ' : ''}have class '${className}'`);
                }
            },
            text: async (subj, exp) => {
                if (!subj || !subj.__playwrightLocator) {
                    throw new Error(`Expected subject to ${negate ? 'not ' : ''}have text`);
                }
                const text = await subj.__playwrightLocator.textContent() || '';
                const hasText = text.includes(exp);
                if (negate ? hasText : !hasText) {
                    throw new Error(`Expected element to ${negate ? 'not ' : ''}have text containing "${exp}", but got "${text}"`);
                }
            },
            value: async (subj, exp) => {
                if (!subj || !subj.__playwrightLocator) {
                    throw new Error(`Expected subject to ${negate ? 'not ' : ''}have value`);
                }
                const value = await subj.__playwrightLocator.getAttribute('value');
                const matches = value === exp;
                if (negate ? matches : !matches) {
                    throw new Error(`Expected element to ${negate ? 'not ' : ''}have value "${exp}", but got "${value}"`);
                }
            },
            attr: async (subj, attrName, attrValue) => {
                if (!subj || !subj.__playwrightLocator) {
                    throw new Error(`Expected subject to ${negate ? 'not ' : ''}have attribute`);
                }
                const attrVal = await subj.__playwrightLocator.getAttribute(attrName);
                const hasAttr = attrVal !== null;
                if (negate ? hasAttr : !hasAttr) {
                    throw new Error(`Expected element to ${negate ? 'not ' : ''}have attribute "${attrName}"`);
                }
                if (attrValue !== undefined) {
                    const matches = attrVal === attrValue;
                    if (negate ? matches : !matches) {
                        throw new Error(`Expected attribute "${attrName}" to ${negate ? 'not ' : ''}be "${attrValue}", but got "${attrVal}"`);
                    }
                }
            },
            property: async (subj, propName, propValue) => {
                if (!subj || !subj.__playwrightLocator) {
                    throw new Error(`Expected subject to ${negate ? 'not ' : ''}have property`);
                }
                const propVal = await subj.__playwrightLocator.evaluate((el, prop) => el[prop], propName);
                const hasProp = propVal !== undefined && propVal !== null;
                if (negate ? hasProp : !hasProp) {
                    throw new Error(`Expected element to ${negate ? 'not ' : ''}have property "${propName}"`);
                }
                if (propValue !== undefined) {
                    const matches = propVal === propValue;
                    if (negate ? matches : !matches) {
                        throw new Error(`Expected property "${propName}" to ${negate ? 'not ' : ''}be "${propValue}", but got "${propVal}"`);
                    }
                }
            },
            css: async (subj, cssProp, cssValue) => {
                if (!subj || !subj.__playwrightLocator) {
                    throw new Error(`Expected subject to ${negate ? 'not ' : ''}have CSS property`);
                }
                const cssVal = await subj.__playwrightLocator.evaluate((el, prop) => window.getComputedStyle(el).getPropertyValue(prop), cssProp);
                const hasCss = !!cssVal;
                if (negate ? hasCss : !hasCss) {
                    throw new Error(`Expected element to ${negate ? 'not ' : ''}have CSS property "${cssProp}"`);
                }
                if (cssValue !== undefined) {
                    const matches = cssVal.includes(cssValue);
                    if (negate ? matches : !matches) {
                        throw new Error(`Expected CSS property "${cssProp}" to ${negate ? 'not ' : ''}contain "${cssValue}", but got "${cssVal}"`);
                    }
                }
            },
            length: async (subj, exp) => {
                let len = 0;
                if (subj && subj.__playwrightLocator) {
                    len = await subj.__playwrightLocator.count();
                }
                else if (Array.isArray(subj)) {
                    len = subj.length;
                }
                else if (subj && typeof subj.length === 'number') {
                    len = subj.length;
                }
                const matches = len === exp;
                if (negate ? matches : !matches) {
                    throw new Error(`Expected subject to ${negate ? 'not ' : ''}have length ${exp}, but got ${len}`);
                }
            },
            contain: async (subj, exp) => {
                let contains = false;
                if (typeof subj === 'string') {
                    contains = subj.includes(exp);
                }
                else if (subj && subj.__playwrightLocator) {
                    const text = await subj.__playwrightLocator.textContent() || '';
                    contains = text.includes(exp);
                }
                else if (Array.isArray(subj)) {
                    contains = subj.includes(exp);
                }
                if (negate ? contains : !contains) {
                    throw new Error(`Expected subject to ${negate ? 'not ' : ''}contain "${exp}"`);
                }
            },
            include: async (subj, exp) => {
                // Alias for contain
                let includes = false;
                if (typeof subj === 'string') {
                    includes = subj.includes(exp);
                }
                else if (subj && subj.__playwrightLocator) {
                    const text = await subj.__playwrightLocator.textContent() || '';
                    includes = text.includes(exp);
                }
                else if (Array.isArray(subj)) {
                    includes = subj.includes(exp);
                }
                if (negate ? includes : !includes) {
                    throw new Error(`Expected subject to ${negate ? 'not ' : ''}include "${exp}"`);
                }
            },
            match: async (subj, pattern) => {
                let matches = false;
                if (typeof subj === 'string') {
                    const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern);
                    matches = regex.test(subj);
                }
                else if (subj && subj.__playwrightLocator) {
                    const text = await subj.__playwrightLocator.textContent() || '';
                    const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern);
                    matches = regex.test(text);
                }
                else {
                    throw new Error(`match assertion requires a string or element with text`);
                }
                if (negate ? matches : !matches) {
                    throw new Error(`Expected subject to ${negate ? 'not ' : ''}match ${pattern}`);
                }
            },
            focused: async (subj) => {
                if (!subj || !subj.__playwrightLocator) {
                    throw new Error(`Expected subject to ${negate ? 'not ' : ''}be focused`);
                }
                const isFocused = await subj.__playwrightLocator.evaluate((el) => document.activeElement === el);
                if (negate ? isFocused : !isFocused) {
                    throw new Error(`Expected subject to ${negate ? 'not ' : ''}be focused`);
                }
            },
            id: async (subj, expectedId) => {
                if (!subj || !subj.__playwrightLocator) {
                    throw new Error(`Expected subject to ${negate ? 'not ' : ''}have id`);
                }
                const id = await subj.__playwrightLocator.getAttribute('id');
                const matches = id === expectedId;
                if (negate ? matches : !matches) {
                    throw new Error(`Expected element to ${negate ? 'not ' : ''}have id "${expectedId}", but got "${id}"`);
                }
            },
            html: async (subj, expectedHtml) => {
                if (!subj || !subj.__playwrightLocator) {
                    throw new Error(`Expected subject to ${negate ? 'not ' : ''}have HTML`);
                }
                const html = await subj.__playwrightLocator.evaluate((el) => el.innerHTML);
                const matches = html === expectedHtml;
                if (negate ? matches : !matches) {
                    throw new Error(`Expected element to ${negate ? 'not ' : ''}have HTML "${expectedHtml}", but got "${html}"`);
                }
            },
            descendants: async (subj, selector) => {
                if (!subj || !subj.__playwrightLocator) {
                    throw new Error(`Expected subject to ${negate ? 'not ' : ''}have descendants`);
                }
                const count = await subj.__playwrightLocator.locator(selector).count();
                const hasDescendants = count > 0;
                if (negate ? hasDescendants : !hasDescendants) {
                    throw new Error(`Expected element to ${negate ? 'not ' : ''}have descendants matching "${selector}"`);
                }
            },
            true: async (subj) => {
                if (negate ? subj === true : subj !== true) {
                    throw new Error(`Expected ${subj} to ${negate ? 'not ' : ''}be true`);
                }
            },
            false: async (subj) => {
                if (negate ? subj === false : subj !== false) {
                    throw new Error(`Expected ${subj} to ${negate ? 'not ' : ''}be false`);
                }
            },
            null: async (subj) => {
                if (negate ? subj === null : subj !== null) {
                    throw new Error(`Expected ${subj} to ${negate ? 'not ' : ''}be null`);
                }
            },
            undefined: async (subj) => {
                if (negate ? subj === undefined : subj !== undefined) {
                    throw new Error(`Expected ${subj} to ${negate ? 'not ' : ''}be undefined`);
                }
            },
            NaN: async (subj) => {
                const isNaN = Number.isNaN(subj);
                if (negate ? isNaN : !isNaN) {
                    throw new Error(`Expected ${subj} to ${negate ? 'not ' : ''}be NaN`);
                }
            },
            ok: async (subj) => {
                const isTruthy = !!subj;
                if (negate ? isTruthy : !isTruthy) {
                    throw new Error(`Expected ${subj} to ${negate ? 'not ' : ''}be truthy`);
                }
            },
            truthy: async (subj) => {
                const isTruthy = !!subj;
                if (negate ? isTruthy : !isTruthy) {
                    throw new Error(`Expected ${subj} to ${negate ? 'not ' : ''}be truthy`);
                }
            },
            gt: async (subj, threshold) => {
                const matches = subj > threshold;
                if (negate ? matches : !matches) {
                    throw new Error(`Expected ${subj} to ${negate ? 'not ' : ''}be greater than ${threshold}`);
                }
            },
            greaterThan: async (subj, threshold) => {
                const matches = subj > threshold;
                if (negate ? matches : !matches) {
                    throw new Error(`Expected ${subj} to ${negate ? 'not ' : ''}be greater than ${threshold}`);
                }
            },
            gte: async (subj, threshold) => {
                const matches = subj >= threshold;
                if (negate ? matches : !matches) {
                    throw new Error(`Expected ${subj} to ${negate ? 'not ' : ''}be greater than or equal to ${threshold}`);
                }
            },
            least: async (subj, threshold) => {
                const matches = subj >= threshold;
                if (negate ? matches : !matches) {
                    throw new Error(`Expected ${subj} to ${negate ? 'not ' : ''}be greater than or equal to ${threshold}`);
                }
            },
            lt: async (subj, threshold) => {
                const matches = subj < threshold;
                if (negate ? matches : !matches) {
                    throw new Error(`Expected ${subj} to ${negate ? 'not ' : ''}be less than ${threshold}`);
                }
            },
            lessThan: async (subj, threshold) => {
                const matches = subj < threshold;
                if (negate ? matches : !matches) {
                    throw new Error(`Expected ${subj} to ${negate ? 'not ' : ''}be less than ${threshold}`);
                }
            },
            lte: async (subj, threshold) => {
                const matches = subj <= threshold;
                if (negate ? matches : !matches) {
                    throw new Error(`Expected ${subj} to ${negate ? 'not ' : ''}be less than or equal to ${threshold}`);
                }
            },
            most: async (subj, threshold) => {
                const matches = subj <= threshold;
                if (negate ? matches : !matches) {
                    throw new Error(`Expected ${subj} to ${negate ? 'not ' : ''}be less than or equal to ${threshold}`);
                }
            },
            within: async (subj, start, finish) => {
                const matches = subj >= start && subj <= finish;
                if (negate ? matches : !matches) {
                    throw new Error(`Expected ${subj} to ${negate ? 'not ' : ''}be within ${start} and ${finish}`);
                }
            },
            closeTo: async (subj, expected, delta) => {
                const actualDelta = Math.abs(subj - expected);
                const matches = actualDelta <= (delta || 1);
                if (negate ? matches : !matches) {
                    throw new Error(`Expected ${subj} to ${negate ? 'not ' : ''}be close to ${expected} within ${delta || 1}`);
                }
            },
            oneOf: async (subj, list) => {
                const matches = Array.isArray(list) && list.includes(subj);
                if (negate ? matches : !matches) {
                    throw new Error(`Expected ${subj} to ${negate ? 'not ' : ''}be one of ${JSON.stringify(list)}`);
                }
            },
            instanceOf: async (subj, constructor) => {
                const matches = subj instanceof constructor;
                if (negate ? matches : !matches) {
                    throw new Error(`Expected ${subj} to ${negate ? 'not ' : ''}be an instance of ${constructor.name}`);
                }
            },
            keys: async (subj, keys) => {
                const keyList = Array.isArray(keys) ? keys : [keys];
                const objKeys = subj && typeof subj === 'object' ? Object.keys(subj) : [];
                const hasAll = keyList.every((k) => objKeys.includes(k));
                if (negate ? hasAll : !hasAll) {
                    throw new Error(`Expected object to ${negate ? 'not ' : ''}have keys ${JSON.stringify(keyList)}`);
                }
            },
            above: async (subj, threshold) => {
                const matches = subj > threshold;
                if (negate ? matches : !matches) {
                    throw new Error(`Expected ${subj} to ${negate ? 'not ' : ''}be above ${threshold}`);
                }
            },
            below: async (subj, threshold) => {
                const matches = subj < threshold;
                if (negate ? matches : !matches) {
                    throw new Error(`Expected ${subj} to ${negate ? 'not ' : ''}be below ${threshold}`);
                }
            },
            prop: async (subj, propName, propValue) => {
                // Alias for property (jQuery .prop())
                const handler = handlers.property;
                if (handler) {
                    await handler(subj, propName, propValue, negate);
                }
            },
            data: async (subj, dataKey, dataValue) => {
                if (!subj || !subj.__playwrightLocator) {
                    throw new Error(`Expected subject to ${negate ? 'not ' : ''}have data`);
                }
                const val = await subj.__playwrightLocator.evaluate((el, key) => el.dataset?.[key] || el.getAttribute(`data-${key}`), dataKey);
                const hasData = val !== undefined && val !== null;
                if (negate ? hasData : !hasData) {
                    throw new Error(`Expected element to ${negate ? 'not ' : ''}have data "${dataKey}"`);
                }
                if (dataValue !== undefined) {
                    const matches = val === dataValue;
                    if (negate ? matches : !matches) {
                        throw new Error(`Expected data "${dataKey}" to ${negate ? 'not ' : ''}be "${dataValue}", but got "${val}"`);
                    }
                }
            },
            selected: async (subj) => {
                if (!subj || !subj.__playwrightLocator) {
                    throw new Error(`Expected subject to ${negate ? 'not ' : ''}be selected`);
                }
                const isSelected = await subj.__playwrightLocator.evaluate((el) => el.selected === true);
                if (negate ? isSelected : !isSelected) {
                    throw new Error(`Expected subject to ${negate ? 'not ' : ''}be selected`);
                }
            },
            satisfy: async (subj, predicate) => {
                if (typeof predicate !== 'function') {
                    throw new Error(`satisfy assertion requires a function predicate`);
                }
                const result = predicate(subj);
                const matches = result === true;
                if (negate ? matches : !matches) {
                    throw new Error(`Expected ${subj} to ${negate ? 'not ' : ''}satisfy the given predicate`);
                }
            },
            members: async (subj, expectedMembers) => {
                const arr = Array.isArray(subj) ? subj : (subj && typeof subj.toArray === 'function' ? subj.toArray() : []);
                const expected = Array.isArray(expectedMembers) ? expectedMembers : [expectedMembers];
                const hasAll = expected.every((item) => arr.includes(item));
                if (negate ? hasAll : !hasAll) {
                    throw new Error(`Expected ${JSON.stringify(arr)} to ${negate ? 'not ' : ''}have members ${JSON.stringify(expected)}`);
                }
            },
            eql: async (subj, exp) => {
                // Loose equality (==) — distinct from eq (===)
                const matches = subj == exp;
                if (negate ? matches : !matches) {
                    throw new Error(`Expected ${subj} to ${negate ? 'not ' : ''}loosely equal ${exp}`);
                }
            },
        };
        // Handle have.length.<operator> like "have.length.gte", "have.length.gt", etc.
        if (mainAssertion === 'have' && subAssertion === 'length' && extraParam) {
            const operatorHandler = handlers[extraParam];
            if (operatorHandler) {
                // Resolve the length first, then apply the numeric operator
                await retryAssertion(async () => {
                    let len = 0;
                    if (subject && subject.__playwrightLocator) {
                        len = await subject.__playwrightLocator.count();
                    }
                    else if (Array.isArray(subject)) {
                        len = subject.length;
                    }
                    else if (subject && typeof subject.length === 'number') {
                        len = subject.length;
                    }
                    await operatorHandler(len, expected, expectedValueCheck, negate);
                });
                return subject;
            }
        }
        // Handle "be.at.least" / "be.at.most" (Chai 3-part chains)
        if (subAssertion === 'at' && extraParam === 'least') {
            const handler = handlers.gte || handlers.least;
            if (handler) {
                await retryAssertion(handler);
                return subject;
            }
        }
        if (subAssertion === 'at' && extraParam === 'most') {
            const handler = handlers.lte || handlers.most;
            if (handler) {
                await retryAssertion(handler);
                return subject;
            }
        }
        // Handle chained assertions like "have.attr.href"
        if (mainAssertion === 'have' && subAssertion && extraParam) {
            // For "have.attr.href", subAssertion is "attr", extraParam is "href"
            const handler = handlers[subAssertion];
            if (handler) {
                await retryAssertion(handler);
                return subject;
            }
        }
        // Handle "be.visible", "have.attr", etc.
        if (subAssertion) {
            const handler = handlers[subAssertion];
            if (handler) {
                await retryAssertion(handler);
                return subject;
            }
        }
        // Handle simple assertions like "eq", "exist", "contain"
        const handler = handlers[mainAssertion];
        if (handler) {
            await retryAssertion(handler);
            return subject;
        }
        // Handle deep.equal specially
        if (mainAssertion === 'deep' && subAssertion === 'equal') {
            const deepEqual = (a, b) => {
                if (a === b)
                    return true;
                if (a == null || b == null)
                    return false;
                if (typeof a !== typeof b)
                    return false;
                if (typeof a === 'object') {
                    const aKeys = Object.keys(a);
                    const bKeys = Object.keys(b);
                    if (aKeys.length !== bKeys.length)
                        return false;
                    for (const key of aKeys) {
                        if (!bKeys.includes(key) || !deepEqual(a[key], b[key])) {
                            return false;
                        }
                    }
                    return true;
                }
                return a === b;
            };
            if (!deepEqual(subject, expected)) {
                throw new Error(`Expected deep equality between ${JSON.stringify(subject)} and ${JSON.stringify(expected)}`);
            }
            return subject;
        }
        throw new Error(`Assertion "${assertion}" is not yet supported`);
    }
    async and(assertion, value) {
        return this.should(assertion, value);
    }
}
exports.CommandTranslatorAssertions = CommandTranslatorAssertions;
