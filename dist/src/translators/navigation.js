"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandTranslatorNavigation = void 0;
const base_1 = require("./base");
const VIEWPORT_PRESETS = {
    'macbook-15': { width: 1440, height: 900 },
    'macbook-13': { width: 1280, height: 800 },
    'macbook-11': { width: 1280, height: 720 },
    'macbook-16': { width: 1536, height: 960 },
    'ipad-2': { width: 768, height: 1024 },
    'ipad-mini': { width: 768, height: 1024 },
    'ipad-pro': { width: 1024, height: 1366 },
    'iphone-6': { width: 375, height: 667 },
    'iphone-6plus': { width: 414, height: 736 },
    'iphone-se2': { width: 375, height: 667 },
    'iphone-x': { width: 375, height: 812 },
    'iphone-xr': { width: 414, height: 896 },
    'iphone-12': { width: 390, height: 844 },
    'iphone-12-pro': { width: 390, height: 844 },
    'iphone-12-pro-max': { width: 428, height: 926 },
    'iphone-13': { width: 390, height: 844 },
    'iphone-13-pro': { width: 390, height: 844 },
    'iphone-13-pro-max': { width: 428, height: 926 },
    'iphone-14': { width: 390, height: 844 },
    'iphone-14-pro': { width: 393, height: 852 },
    'iphone-14-pro-max': { width: 430, height: 932 },
    'iphone-se': { width: 375, height: 667 },
    'samsung-s10': { width: 360, height: 760 },
};
class CommandTranslatorNavigation extends base_1.CommandTranslatorBase {
    constructor(page, context) {
        super(page, context);
        Object.assign(this.methodMap, {
            visit: this.visit.bind(this),
            viewport: this.viewport.bind(this),
            reload: this.reload.bind(this),
            go: this.go.bind(this),
            url: this.url.bind(this),
            title: this.title.bind(this),
            location: this.location.bind(this),
            screenshot: this.screenshot.bind(this),
            wait: this.wait.bind(this),
            log: this.log.bind(this),
            window: this.window.bind(this),
            document: this.document.bind(this),
        });
    }
    async visit(urlOrOptions, options) {
        let url;
        let visitOptions = {};
        if (typeof urlOrOptions === 'object') {
            url = urlOrOptions.url;
            visitOptions = urlOrOptions;
        }
        else {
            url = urlOrOptions;
            visitOptions = options || {};
        }
        const gotoOptions = { waitUntil: 'load', timeout: visitOptions.timeout || 60000 };
        // Handle auth header if provided
        if (visitOptions.auth) {
            const authHeader = `Basic ${Buffer.from(`${visitOptions.auth.username}:${visitOptions.auth.password}`).toString('base64')}`;
            gotoOptions.headers = { ...visitOptions.headers, Authorization: authHeader };
        }
        else if (visitOptions.headers) {
            gotoOptions.headers = visitOptions.headers;
        }
        // Handle method and body for POST requests
        if (visitOptions.method === 'POST' && visitOptions.body) {
            gotoOptions.method = 'POST';
            if (typeof visitOptions.body === 'object') {
                gotoOptions.postData = JSON.stringify(visitOptions.body);
                gotoOptions.headers = { ...gotoOptions.headers, 'Content-Type': 'application/json' };
            }
            else {
                gotoOptions.postData = visitOptions.body;
            }
        }
        // Handle query string parameters
        if (visitOptions.qs && typeof visitOptions.qs === 'object') {
            const urlObj = new URL(url, 'http://localhost');
            for (const [key, value] of Object.entries(visitOptions.qs)) {
                urlObj.searchParams.append(key, String(value));
            }
            // Extract just the path + query if the original URL was relative
            const baseUrl = url.match(/^https?:\/\//) ? url : undefined;
            if (baseUrl) {
                const base = new URL(baseUrl);
                base.search = urlObj.search;
                url = base.toString();
            }
            else {
                url = urlObj.pathname + urlObj.search;
            }
        }
        await this.context.page.goto(url, gotoOptions);
        // Call onBeforeLoad if provided
        if (visitOptions.onBeforeLoad) {
            await this.context.page.evaluate((fn) => {
                if (typeof fn === 'function')
                    fn(window);
            }, visitOptions.onBeforeLoad);
        }
        // Poll until URL is no longer about:blank
        const startTime = Date.now();
        while (Date.now() - startTime < 10000) {
            const currentUrl = this.context.page.url();
            if (currentUrl && currentUrl !== 'about:blank') {
                // Call onLoad if provided
                if (visitOptions.onLoad) {
                    await this.context.page.evaluate((fn) => {
                        if (typeof fn === 'function')
                            fn(window);
                    }, visitOptions.onLoad);
                }
                return;
            }
            await this.context.page.waitForTimeout(100);
        }
        throw new Error('Navigation timeout: URL remained about:blank after 10s');
    }
    async viewport(width, height) {
        let w, h;
        if (typeof width === 'string' && VIEWPORT_PRESETS[width]) {
            w = VIEWPORT_PRESETS[width].width;
            h = VIEWPORT_PRESETS[width].height;
        }
        else {
            w = typeof width === 'string' ? parseInt(width, 10) : width;
            h = typeof height === 'string' ? parseInt(height, 10) : height;
        }
        await this.context.page.setViewportSize({ width: w, height: h });
    }
    async reload(forceReload, options) {
        let reloadOptions = {};
        if (typeof forceReload === 'boolean') {
            // cy.reload(true) or cy.reload(false)
            if (forceReload) {
                reloadOptions = { ...options, ignoreCache: true };
            }
            else {
                reloadOptions = options || {};
            }
        }
        else if (typeof forceReload === 'object') {
            // cy.reload({ log: false })
            reloadOptions = forceReload;
        }
        await this.context.page.reload(reloadOptions);
    }
    async go(direction, options) {
        let steps = 1;
        if (typeof direction === 'number') {
            steps = direction;
        }
        else if (direction === 'back') {
            steps = -1;
        }
        else if (direction === 'forward') {
            steps = 1;
        }
        if (steps > 0) {
            for (let i = 0; i < steps; i++) {
                await this.context.page.goForward();
            }
        }
        else {
            for (let i = 0; i < Math.abs(steps); i++) {
                await this.context.page.goBack();
            }
        }
    }
    async url() {
        return this.context.page.url();
    }
    async title() {
        return this.context.page.title();
    }
    async location(key) {
        if (key) {
            return this.context.page.evaluate((k) => window.location[k], key);
        }
        return this.context.page.evaluate(() => window.location.href);
    }
    async screenshot(filenameOrOptions, options) {
        let filename;
        let screenshotOptions = {};
        if (typeof filenameOrOptions === 'object') {
            screenshotOptions = filenameOrOptions;
        }
        else {
            filename = filenameOrOptions;
            screenshotOptions = options || {};
        }
        if (filename) {
            screenshotOptions.path = filename;
        }
        // Map Cypress-specific options to Playwright where possible
        if (screenshotOptions.capture === 'fullPage') {
            screenshotOptions.fullPage = true;
        }
        if (screenshotOptions.clip) {
            screenshotOptions.clip = screenshotOptions.clip;
        }
        return this.context.page.screenshot(screenshotOptions);
    }
    async wait(msOrAlias, options) {
        // Handle array of aliases: cy.wait(['@alias1', '@alias2'])
        if (Array.isArray(msOrAlias)) {
            const promises = msOrAlias.map(alias => {
                const requestPromise = this.requestAliases.get(alias);
                if (!requestPromise) {
                    console.warn(`Alias ${alias} not found in request aliases`);
                    return Promise.resolve();
                }
                const waitTimeout = options?.timeout || 60000;
                return Promise.race([
                    requestPromise,
                    new Promise((resolve) => setTimeout(resolve, waitTimeout))
                ]);
            });
            await Promise.all(promises);
            return;
        }
        let timeout = 0;
        if (typeof msOrAlias === 'string') {
            if (msOrAlias.includes('@')) {
                // Wait for aliased request
                const alias = msOrAlias;
                const requestPromise = this.requestAliases.get(alias);
                if (requestPromise) {
                    const waitTimeout = options?.timeout || 60000;
                    await Promise.race([
                        requestPromise,
                        new Promise((resolve) => setTimeout(resolve, waitTimeout))
                    ]);
                }
                else {
                    console.warn(`Alias ${alias} not found in request aliases`);
                }
                return;
            }
            else {
                // Convert string to number if needed
                timeout = parseInt(msOrAlias, 10);
            }
        }
        else {
            timeout = msOrAlias;
        }
        if (isNaN(timeout)) {
            throw new Error(`wait() expected a number or numeric string, got: ${msOrAlias}`);
        }
        await this.context.page.waitForTimeout(timeout);
    }
    async log(messageOrOptions, value) {
        if (typeof messageOrOptions === 'object') {
            const options = messageOrOptions;
            const consoleProps = options.consoleProps ? options.consoleProps() : {};
            console.log(`[Cypress.log] ${options.name || ''} ${options.message || ''}`, consoleProps);
        }
        else {
            const message = value !== undefined ? `${messageOrOptions} ${JSON.stringify(value)}` : messageOrOptions;
            console.log(`[Cypress.log] ${message}`);
        }
    }
    async window(options) {
        // Return a serializable window proxy object
        // Cypress's cy.window() yields the remote window object
        // Retry if execution context was destroyed (e.g., due to navigation)
        const maxRetries = 3;
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await this.context.page.evaluate(() => ({
                    __cypressWindow: true,
                    location: {
                        href: window.location.href,
                        hostname: window.location.hostname,
                        pathname: window.location.pathname,
                        protocol: window.location.protocol,
                        hash: window.location.hash,
                        search: window.location.search,
                    },
                    innerWidth: window.innerWidth,
                    innerHeight: window.innerHeight,
                }));
            }
            catch (error) {
                if (error.message && error.message.includes('Execution context was destroyed')) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    continue;
                }
                throw error;
            }
        }
        throw new Error('Failed to get window object after retries');
    }
    async document(options) {
        const maxRetries = 3;
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await this.context.page.evaluate(() => ({
                    __cypressDocument: true,
                    title: document.title,
                    URL: document.URL,
                }));
            }
            catch (error) {
                if (error.message && error.message.includes('Execution context was destroyed')) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    continue;
                }
                throw error;
            }
        }
        throw new Error('Failed to get document object after retries');
    }
}
exports.CommandTranslatorNavigation = CommandTranslatorNavigation;
