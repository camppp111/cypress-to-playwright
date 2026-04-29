import { Page, BrowserContext } from '@playwright/test';
import { CommandTranslatorInteraction } from './interaction';
import type { ContainsOptions, GetOptions } from './types';

const IMPLICIT_ROLE_MAP: Record<string, string> = {
  link: 'a[href]',
  button: 'button:not([type="hidden"]),input[type="button"],input[type="submit"]',
  heading: 'h1,h2,h3,h4,h5,h6',
  textbox: 'input:not([type]),input[type="text"],textarea',
  checkbox: 'input[type="checkbox"]',
  radio: 'input[type="radio"]',
  list: 'ul,ol',
  listitem: 'li',
  navigation: 'nav',
  region: 'section',
  search: '[type="search"]',
  article: 'article',
  dialog: 'dialog',
  img: 'img',
  paragraph: 'p',
  generic: 'span,div',
  presentation: '[role="presentation"], [role="none"]',
  tab: '[role="tab"]',
  tabpanel: '[role="tabpanel"]',
  menu: '[role="menu"]',
  menuitem: '[role="menuitem"]',
  banner: 'header',
  contentinfo: 'footer',
  form: 'form',
  main: 'main',
  complementary: 'aside',
};

export class CommandTranslatorSelection extends CommandTranslatorInteraction {
  constructor(page: Page, context?: BrowserContext) {
    super(page, context);
    Object.assign(this.methodMap, {
      get: this.get.bind(this),
      find: this.find.bind(this),
      contains: this.contains.bind(this),
      findByTestId: this.findByTestId.bind(this),
      findAllByTestId: this.findAllByTestId.bind(this),
      findByRole: this.findByRole.bind(this),
      findAllByRole: this.findAllByRole.bind(this),
      findAllByText: this.findAllByText.bind(this),
      findByText: this.findByText.bind(this),
      findByPlaceholderText: this.findByPlaceholderText.bind(this),
      findByLabelText: this.findByLabelText.bind(this),
      eq: this.eq.bind(this),
      first: this.first.bind(this),
      last: this.last.bind(this),
      each: this.each.bind(this),
    });
  }

  private async get(selectorOrAlias: string, options?: Partial<GetOptions>): Promise<any> {
    // Support alias syntax: cy.get('@alias')
    if (selectorOrAlias.startsWith('@')) {
      const alias = selectorOrAlias;
      const requestPromise = this.requestAliases.get(alias);
      if (requestPromise) {
        return await requestPromise;
      }
      console.warn(`Alias ${alias} not found in request aliases`);
    }
    const locator = this.getLocator(selectorOrAlias);
    return this.createJQueryWrapper(locator);
  }

  private async find(selector: string): Promise<any> {
    const locator = this.getLocator(selector);
    return this.createJQueryWrapper(locator);
  }

  private async contains(selectorOrText: string | number | RegExp, textOrOptions?: string | object, options?: Partial<ContainsOptions>): Promise<any> {
    // Parse arguments to determine which form is being used:
    // contains(content)
    // contains(content, options)
    // contains(selector, content)
    // contains(selector, content, options)

    let selector: string | undefined;
    let text: string | number | RegExp;
    let containsOptions: Partial<ContainsOptions> = {};

    if (textOrOptions === undefined) {
      // contains(content) form
      text = selectorOrText;
    } else if (typeof textOrOptions === 'object') {
      // contains(content, options) form
      text = selectorOrText;
      containsOptions = textOrOptions as Partial<ContainsOptions>;
    } else if (options === undefined) {
      // contains(selector, content) form
      selector = String(selectorOrText);
      text = textOrOptions;
    } else {
      // contains(selector, content, options) form
      selector = String(selectorOrText);
      text = textOrOptions;
      containsOptions = options;
    }

    let locator: any;
    if (selector) {
      // Has a selector - use locator with filter
      const base = this.withinSubjectChain.length > 0
        ? this.withinSubjectChain[this.withinSubjectChain.length - 1].locator(selector)
        : this.context.page.locator(selector);

      if (typeof text === 'string') {
        locator = base.filter({ hasText: text }).first();
      } else if (text instanceof RegExp) {
        // Playwright doesn't support RegExp in hasText filter directly
        // Fallback: get all elements and filter manually
        const all = await base.all();
        for (const el of all) {
          const content = await el.textContent() || '';
          if (text.test(content)) {
            locator = el;
            break;
          }
        }
        if (!locator) {
          // If no match, return the first element so we don't break the chain
          locator = base.first();
        }
      } else {
        // Number - convert to string
        locator = base.filter({ hasText: String(text) }).first();
      }
    } else {
      // No selector - use getByText
      const scope = this.withinSubjectChain.length > 0
        ? this.withinSubjectChain[this.withinSubjectChain.length - 1]
        : this.context.page;

      if (typeof text === 'string') {
        locator = scope.getByText(text).first();
      } else if (text instanceof RegExp) {
        locator = scope.getByText(text).first();
      } else {
        locator = scope.getByText(String(text)).first();
      }
    }

    // Wait for the element to appear (respect timeout from options if provided)
    const timeout = containsOptions.timeout || 5000;
    await locator.waitFor({ state: 'attached', timeout }).catch(() => {});
    return this.createJQueryWrapper(locator);
  }

  private async findByTestId(testId: string): Promise<any> {
    const locator = this.getLocator(`[data-testid="${testId}"]`);
    return this.createJQueryWrapper(locator);
  }
  
  private async findAllByTestId(testId: string): Promise<any> {
    const selector = `[data-testid="${testId}"]`;
    const locator = this.getLocator(selector);
    return this.createJQueryWrapper(locator);
  }

  private async findByRole(role: string, options?: { name?: string | RegExp }): Promise<any> {
    const baseSelector = IMPLICIT_ROLE_MAP[role] || `[role="${role}"]`;
    let locator: any;

    if (this.withinSubjectChain.length > 0 && options?.name) {
      locator = this.withinSubjectChain[this.withinSubjectChain.length - 1].getByRole(role as any, { name: options.name }).filter({ visible: true }).first();
    } else if (options?.name) {
      locator = this.context.page.getByRole(role as any, { name: options.name }).filter({ visible: true }).first();
    } else {
      locator = this.context.page.locator(baseSelector).filter({ visible: true }).first();
    }
    return this.createJQueryWrapper(locator);
  }

  private async findAllByRole(role: string, options?: { name?: string | RegExp }): Promise<any> {
    const baseSelector = IMPLICIT_ROLE_MAP[role] || `[role="${role}"]`;
    let locator: any;

    if (this.withinSubjectChain.length > 0 && options?.name) {
      locator = this.withinSubjectChain[this.withinSubjectChain.length - 1].getByRole(role as any, { name: options.name }).filter({ visible: true });
    } else if (options?.name) {
      locator = this.context.page.getByRole(role as any, { name: options.name }).filter({ visible: true });
    } else {
      locator = this.context.page.locator(baseSelector).filter({ visible: true });
    }
    return this.createJQueryWrapper(locator, false);
  }

  private async findAllByText(text: string | RegExp): Promise<any> {
    // Find all elements containing the text
    let locator;
    if (typeof text === 'string') {
      locator = this.context.page.locator(`text=${text}`);
    } else {
      // For RegExp, use getByText
      locator = this.context.page.getByText(text);
    }
    return this.createJQueryWrapper(locator);
  }

  private async findByText(text: string | RegExp): Promise<any> {
    // Find first element containing the text
    const locator = await this.findAllByText(text);
    // Get the first element from the wrapped collection
    return locator.first();
  }

  private async findByPlaceholderText(placeholder: string | RegExp): Promise<any> {
    const locator = this.context.page.getByPlaceholder(placeholder).first();
    return this.createJQueryWrapper(locator);
  }

  private async findByLabelText(label: string | RegExp): Promise<any> {
    const locator = this.context.page.getByLabel(label).first();
    return this.createJQueryWrapper(locator);
  }

  private async eq(index: number): Promise<any> {
    // Get the nth element from the current subject (collection)
    const subject = this.currentSubject;
    if (!subject) {
      throw new Error('eq() requires a subject (use get, find, etc. first)');
    }

    // If subject is a wrapped collection with its own eq method, use it
    if (subject.__isCollection && typeof subject.eq === 'function') {
      return subject.eq(index);
    }

    // If subject is a Playwright locator with multiple elements, get nth
    if (subject.nth) {
      return this.createJQueryWrapper(subject.nth(index));
    }

    return this.createJQueryWrapper(subject);
  }

  private async first(): Promise<any> {
    // Get the first element from the current subject (collection)
    const subject = this.currentSubject;
    if (!subject) {
      throw new Error('first() requires a subject (use get, find, etc. first)');
    }

    // If subject is a wrapped collection with its own first method, use it
    if (subject.__isCollection && typeof subject.first === 'function') {
      return subject.first();
    }

    // If subject is a Playwright locator, get first
    if (subject.first) {
      return this.createJQueryWrapper(subject.first());
    }

    return this.createJQueryWrapper(subject);
  }

  private async each(callback: (element: any, index: number) => void | Promise<void>): Promise<void> {
    if (!this.currentSubject) {
      throw new Error('each() requires a subject (use findAllByText, get, etc. first)');
    }

    // If subject is a wrapped collection with its own each method, use it
    if (this.currentSubject.__isCollection && typeof this.currentSubject.each === 'function') {
      return this.currentSubject.each(callback);
    }

    // If subject is a Playwright locator, iterate over all elements
    if (this.currentSubject.count) {
      const count = await this.currentSubject.count();
      for (let i = 0; i < count; i++) {
        const element = this.currentSubject.nth(i);
        // Pre-fetch element data and create synchronous jQuery-like wrapper
        const elementWrapper = await this.createJQueryWrapper(element, true);
        await callback(elementWrapper, i);
      }
    } else {
      // Single element - just call callback once
      await callback(this.currentSubject, 0);
    }
  }

  private async last(): Promise<any> {
    const subject = this.currentSubject;
    if (!subject) {
      throw new Error('last() requires a subject (use get, find, etc. first)');
    }

    // If subject is a wrapped collection with its own last method, use it
    if (subject.__isCollection && typeof subject.last === 'function') {
      return subject.last();
    }

    // If subject is a Playwright locator, get last
    if (subject.last) {
      return this.createJQueryWrapper(subject.last());
    }

    return this.createJQueryWrapper(subject);
  }
}
