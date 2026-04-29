import { Page, BrowserContext } from '@playwright/test';
import config from '../../playwright.config';
import { CommandTranslatorAssertions } from './assertions';

export class CommandTranslatorProperties extends CommandTranslatorAssertions {
  constructor(page: Page, context?: BrowserContext) {
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

  private async its(property: string): Promise<any> {
    if (!this.currentSubject) return undefined;

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
      return await this.currentSubject.__playwrightLocator.evaluate(
        (el: any, propPath: string[]) => propPath.reduce((obj, key) => obj?.[key], el),
        path
      );
    }

    return path.reduce((obj, key) => obj?.[key], this.currentSubject);
  }

  private async hasClass(className: string): Promise<boolean> {
    if (!this.currentSubject) return false;

    const locator = this.currentSubject.__playwrightLocator || this.currentSubject;
    if (locator.locator) {
      return await locator.evaluate((el: any, className: string) => {
        return el.classList.contains(className);
      }, className);
    }
    return false;
  }

  private async length(): Promise<number> {
    if (!this.currentSubject) return 0;

    const locator = this.currentSubject.__playwrightLocator || this.currentSubject;
    if (locator.locator) {
      return await locator.count();
    }
    return 0;
  }

  private async prop(propertyName: string): Promise<any> {
    // Get a property from the current subject (jQuery-compatible)
    // Used for things like $link.prop('href')
    if (!this.currentSubject) {
      throw new Error('prop() requires a subject');
    }
    // If subject is a Playwright locator, get the property via evaluate
    if (this.currentSubject.evaluate) {
      return this.currentSubject.evaluate((el: any, prop: string) => el[prop], propertyName);
    }
    // Fallback for plain objects
    return this.currentSubject[propertyName];
  }

  private async invoke(method: string, ...args: any[]): Promise<any> {
    const methodMap: { [key: string]: string } = {
      removeAttr: 'removeAttribute',
      attr: 'getAttribute',
      prop: 'getAttribute',
      val: 'value',
      text: 'textContent',
      html: 'innerHTML',
    };

    const domMethod = methodMap[method] || method;
    const locator = this.currentSubject.__playwrightLocator || this.currentSubject;
    const result = await locator.evaluate((el: any, data: any) => {
      const fn = (el as any)[data.method];
      if (typeof fn === 'function') {
        return fn.call(el, ...data.args);
      }
      return (el as any)[data.method];
    }, { method: domMethod, args });

    const isPropertyAccess = ['attr', 'prop', 'val', 'text', 'html'].includes(method);
    if (isPropertyAccess) {
      return result;
    }
    return result !== undefined ? result : this.currentSubject;
  }

  private async wrap(value: any, _options?: any): Promise<any> {
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

  private config(attr?: string): any {
    if (!attr) {
      return config;
    }

    // Map Cypress config attributes to Playwright equivalents
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

    // Handle nested attributes like 'viewport.width'
    if (pwAttr.includes('.')) {
      const [parent, child] = pwAttr.split('.');
      const parentValue = (config.use as any)?.[parent];
      return parentValue?.[child];
    }

    return (config.use as any)?.[pwAttr];
  }
}
