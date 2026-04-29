import { Page, BrowserContext } from '@playwright/test';
import { CommandTranslatorProperties } from './properties';
import type { RequestOptions } from './types';

export class CommandTranslatorNetwork extends CommandTranslatorProperties {
  constructor(page: Page, context?: BrowserContext) {
    super(page, context);
    Object.assign(this.methodMap, {
      intercept: this.intercept.bind(this),
      as: this.as.bind(this),
      request: this.request.bind(this),
    });
  }

  private async intercept(arg1: any, arg2?: any, arg3?: any): Promise<any> {
    // Parse arguments to determine which form is being used:
    // cy.intercept(url)
    // cy.intercept(method, url)
    // cy.intercept(routeMatcher)
    // cy.intercept(url, staticResponse)
    // cy.intercept(method, url, staticResponse)
    // cy.intercept(routeMatcher, staticResponse)
    // cy.intercept(url, routeMatcher, staticResponse)
    // cy.intercept(url, routeHandler)
    // cy.intercept(method, url, routeHandler)
    // cy.intercept(routeMatcher, routeHandler)
    // cy.intercept(url, routeMatcher, routeHandler)

    let method: string | undefined;
    let url: string | undefined;
    let routeMatcher: any;
    let staticResponse: any;
    let routeHandler: any;

    // Determine which form based on argument types
    if (arg3 !== undefined) {
      // Three arguments: cy.intercept(url, routeMatcher, staticResponse) or cy.intercept(url, routeMatcher, routeHandler)
      url = arg1;
      routeMatcher = arg2;
      if (typeof arg3 === 'function') {
        routeHandler = arg3;
      } else {
        staticResponse = arg3;
      }
    } else if (arg2 !== undefined) {
      // Two arguments
      if (typeof arg1 === 'string') {
        if (typeof arg2 === 'function') {
          // cy.intercept(url, routeHandler)
          url = arg1;
          routeHandler = arg2;
        } else if (typeof arg2 === 'object') {
          // Could be cy.intercept(method, url) or cy.intercept(url, staticResponse) or cy.intercept(url, routeMatcher)
          if (this.isHttpMethod(arg1)) {
            // cy.intercept(method, url) or cy.intercept(method, url, staticResponse with undefined third arg)
            method = arg1;
            url = arg2;
          } else {
            // cy.intercept(url, staticResponse) or cy.intercept(url, routeMatcher)
            url = arg1;
            if (typeof arg2 === 'function') {
              routeHandler = arg2;
            } else {
              staticResponse = arg2;
            }
          }
        } else {
          // cy.intercept(url, staticResponse) with string response
          url = arg1;
          staticResponse = arg2;
        }
      } else if (typeof arg1 === 'object') {
        // cy.intercept(routeMatcher) or cy.intercept(routeMatcher, staticResponse) or cy.intercept(routeMatcher, routeHandler)
        routeMatcher = arg1;
        if (typeof arg2 === 'function') {
          routeHandler = arg2;
        } else {
          staticResponse = arg2;
        }
      }
    } else {
      // One argument: cy.intercept(url) or cy.intercept(routeMatcher)
      if (typeof arg1 === 'string') {
        url = arg1;
      } else if (typeof arg1 === 'object') {
        routeMatcher = arg1;
      }
    }

    // Build the actual URL and method for Playwright
    let actualUrl = url || (routeMatcher?.url || routeMatcher);
    let actualMethod = method || routeMatcher?.method;

    // Create a unique ID for this intercept
    const interceptId = `intercept-${Date.now()}-${Math.random()}`;
    this.lastInterceptId = interceptId;

    // Create a promise that resolves when the request is made
    let requestResolver: (value: any) => void;
    const requestPromise = new Promise<any>((resolve) => {
      requestResolver = resolve;
    });

    // Set up the route handler
    const handler = (route: any) => {
      // Resolve the promise when request is made
      requestResolver(route);

      if (routeHandler && typeof routeHandler === 'function') {
        // Call the custom route handler
        routeHandler(route);
      } else if (staticResponse !== undefined) {
        // Stub with static response
        route.fulfill({
          status: 200,
          body: typeof staticResponse === 'string' ? staticResponse : JSON.stringify(staticResponse),
          headers: { 'Content-Type': 'application/json' },
        });
      } else {
        // Just spy, continue with the request
        route.continue();
      }
    };

    // Register the route with Playwright
    if (actualMethod) {
      // Use route matching with method - match all URLs and filter in handler
      await this.context.page.route('**', (route) => {
        const request = route.request();
        if (request.method() === actualMethod && request.url().includes(actualUrl)) {
          handler(route);
        } else {
          route.continue();
        }
      });
    } else {
      await this.context.page.route(actualUrl, handler);
    }

    // Store the promise for this intercept (before alias is set)
    this.requestAliases.set(interceptId, requestPromise);

    // Return an object that supports .as() chaining
    return {
      as: (alias: string) => {
        this.requestAliases.set(`@${alias}`, requestPromise);
        return {};
      }
    };
  }

  private async as(alias: string): Promise<any> {
    // Store the alias for the last intercepted request
    if (this.lastInterceptId) {
      const promise = this.requestAliases.get(this.lastInterceptId);
      if (promise) {
        this.requestAliases.set(`@${alias}`, promise);
      }
    }
    return {};
  }

  private async request(options: string | Partial<RequestOptions>): Promise<any> {
    let opts: Partial<RequestOptions> = typeof options === 'string' ? { url: options } : options;

    let url = opts.url || '';
    const method = opts.method || 'GET';
    const headers: any = { ...opts.headers };
    const followRedirect = opts.followRedirect !== false;
    const failOnStatusCode = opts.failOnStatusCode !== false;

    // Handle auth header if provided
    if (opts.auth) {
      const authHeader = `Basic ${Buffer.from(`${opts.auth.username}:${opts.auth.password}`).toString('base64')}`;
      headers['Authorization'] = authHeader;
    }

    // Handle query string parameters
    if (opts.qs && typeof opts.qs === 'object') {
      const urlObj = new URL(url, 'http://localhost');
      for (const [key, value] of Object.entries(opts.qs)) {
        urlObj.searchParams.append(key, String(value));
      }
      url = urlObj.pathname + urlObj.search;
    }

    // Skip about: URLs since they're not network-fetchable
    if (url && url.startsWith('about:')) {
      console.warn(`Skipping request to about: URL: ${url} - about: URLs cannot be fetched over the network`);
      return { status: 200, body: '', headers: {}, duration: 0 };
    }
    // Resolve relative URLs against the current page URL
    else if (url && !url.match(/^https?:\/\//)) {
      const baseUrl = this.context.page.url();
      if (baseUrl && baseUrl !== 'about:blank') {
        url = new URL(url, baseUrl).toString();
      } else {
        const config = require('../../playwright.config').default;
        const baseURL = config.use?.baseURL || 'https://qa.spokeo.com';
        url = new URL(url, baseURL).toString();
      }
    }

    // Build fetch options
    const fetchOptions: any = {
      method,
      headers,
      maxRedirects: followRedirect ? 20 : 0,
    };

    // Handle request body
    if (opts.body) {
      if (typeof opts.body === 'object' && !opts.form) {
        fetchOptions.postData = JSON.stringify(opts.body);
        headers['Content-Type'] = headers['Content-Type'] || 'application/json';
      } else if (opts.form && typeof opts.body === 'object') {
        const formData = new URLSearchParams();
        for (const [key, value] of Object.entries(opts.body)) {
          formData.append(key, String(value));
        }
        fetchOptions.postData = formData.toString();
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
      } else {
        fetchOptions.postData = opts.body;
      }
    }

    if (opts.gzip !== undefined) {
      fetchOptions.compression = opts.gzip ? 'gzip' : 'none';
    }

    // Use Playwright's request context for API calls
    const requestContext = this.context.page.context().request;
    const response = await requestContext.fetch(url, fetchOptions);

    const body = await response.text();
    const result = {
      status: response.status(),
      body,
      headers: response.headers(),
      duration: 0,
    };

    if (failOnStatusCode && response.status() >= 400) {
      throw new Error(`Request failed with status ${response.status()}: ${body}`);
    }

    return result;
  }
}
