import { Page, BrowserContext } from '@playwright/test';
import { CommandTranslatorNavigation } from './navigation';
import type { ClickOptions, TypeOptions, CheckClearOptions, SelectOptions, TriggerOptions, ScrollToOptions, ScrollIntoViewOptions, PositionType } from './types';

export class CommandTranslatorInteraction extends CommandTranslatorNavigation {
  constructor(page: Page, context?: BrowserContext) {
    super(page, context);
    Object.assign(this.methodMap, {
      click: this.click.bind(this),
      type: this.type.bind(this),
      focus: this.focus.bind(this),
      blur: this.blur.bind(this),
      clear: this.clear.bind(this),
      submit: this.submit.bind(this),
      check: this.check.bind(this),
      uncheck: this.uncheck.bind(this),
      select: this.select.bind(this),
      hover: this.hover.bind(this),
      rightclick: this.rightclick.bind(this),
      dblclick: this.dblclick.bind(this),
      trigger: this.trigger.bind(this),
      scrollIntoView: this.scrollIntoView.bind(this),
      scrollTo: this.scrollTo.bind(this),
    });
  }

  private isPositionType(value: string): value is PositionType {
    return ['topLeft', 'top', 'topRight', 'left', 'center', 'right', 'bottomLeft', 'bottom', 'bottomRight'].includes(value);
  }

  private mapPosition(position: PositionType): { x: number; y: number } {
    const map: Record<PositionType, { x: number; y: number }> = {
      topLeft: { x: 0, y: 0 }, top: { x: 50, y: 0 }, topRight: { x: 100, y: 0 },
      left: { x: 0, y: 50 }, center: { x: 50, y: 50 }, right: { x: 100, y: 50 },
      bottomLeft: { x: 0, y: 100 }, bottom: { x: 50, y: 100 }, bottomRight: { x: 100, y: 100 },
    };
    return map[position];
  }

  private async click(positionOrXOrSelector?: PositionType | number | string | Partial<ClickOptions>, xOrOptions?: number | Partial<ClickOptions>, options?: Partial<ClickOptions>): Promise<void> {
    const hasSubject = this.currentSubject && typeof this.currentSubject.click === 'function';
    const locator = hasSubject ? (this.currentSubject.__playwrightLocator || this.currentSubject) : undefined;

    if (typeof positionOrXOrSelector === 'string' && !this.isPositionType(positionOrXOrSelector)) {
      await this.getLocator(positionOrXOrSelector).first().click(xOrOptions as any);
      return;
    }

    if (!locator) {
      throw new Error('click() requires a subject. Use cy.get(selector).click() instead.');
    }

    const clickOptions: any = {};
    if (options?.force) clickOptions.force = true;
    if (options?.timeout) clickOptions.timeout = options.timeout;

    if (typeof positionOrXOrSelector === 'object' && !this.isPositionType(positionOrXOrSelector as any)) {
      const opts = positionOrXOrSelector as Partial<ClickOptions>;
      if (opts.force) clickOptions.force = true;
      if (opts.timeout) clickOptions.timeout = opts.timeout;
      if (opts.multiple && locator.count) {
        const count = await locator.count();
        for (let i = 0; i < count; i++) { await locator.nth(i).click(clickOptions); }
        return;
      }
      await locator.click(clickOptions);
    } else if (typeof positionOrXOrSelector === 'string' && this.isPositionType(positionOrXOrSelector)) {
      const posOptions = typeof xOrOptions === 'object' ? { ...clickOptions, ...xOrOptions } : clickOptions;
      await locator.click({ position: this.mapPosition(positionOrXOrSelector), ...posOptions });
    } else if (typeof positionOrXOrSelector === 'number') {
      const x = positionOrXOrSelector;
      const y = typeof xOrOptions === 'number' ? xOrOptions : 0;
      const coordOptions = typeof xOrOptions === 'object' ? { ...clickOptions, ...xOrOptions } : options ? { ...clickOptions, ...options } : clickOptions;
      await locator.click({ position: { x, y }, ...coordOptions });
    } else {
      await locator.click(clickOptions);
    }
  }

  private async type(textOrOptions: string | Partial<TypeOptions>, textOrOptions2?: string | Partial<TypeOptions>, options?: Partial<TypeOptions>): Promise<void> {
    let text: string;
    let typeOptions: Partial<TypeOptions> = {};

    if (typeof textOrOptions === 'string') {
      text = textOrOptions;
      if (typeof textOrOptions2 === 'object') typeOptions = textOrOptions2;
      else if (typeof textOrOptions2 === 'string') text = textOrOptions2;
    } else {
      text = '';
    }

    // If called on a subject (chained), first arg is text
    if (this.currentSubject) {
      text = typeof textOrOptions === 'string' ? textOrOptions : '';
      if (typeof textOrOptions2 === 'object') typeOptions = textOrOptions2;
      const locator = (this.currentSubject.__playwrightLocator || this.currentSubject).first();
      const delay = typeOptions.delay || 0;
      const parseSpecial = typeOptions.parseSpecialCharSequences !== false;
      if (!parseSpecial) {
        await locator.type(text, { delay });
      } else {
        await this.typeText(locator, text);
      }
      return this.currentSubject;
    }

    // Root form: cy.type(selector, text, options)
    if (typeof textOrOptions === 'string' && typeof textOrOptions2 === 'string') {
      const locator = this.getLocator(textOrOptions).first();
      const delay = (options?.delay) || 0;
      const parseSpecial = options?.parseSpecialCharSequences !== false;
      if (!parseSpecial) {
        await locator.type(textOrOptions2, { delay });
      } else {
        await this.typeText(locator, textOrOptions2);
      }
    }

    try {
      await this.context.page.waitForLoadState('networkidle', { timeout: 5000 });
    } catch {
      // Ignore timeout
    }
  }

  private async focus(): Promise<any> {
    if (this.currentSubject) {
      const locator = this.currentSubject.__playwrightLocator || this.currentSubject;
      await locator.focus();
      return this.currentSubject;
    }
    return this.currentSubject;
  }

  private async blur(options?: Partial<{ log?: boolean; timeout?: number }>): Promise<void> {
    if (this.currentSubject) {
      const locator = this.currentSubject.__playwrightLocator || this.currentSubject;
      await locator.blur();
    } else {
      throw new Error('blur() requires a subject. Use cy.get(selector).blur() instead.');
    }
  }

  private async clear(options?: Partial<CheckClearOptions>): Promise<void> {
    if (this.currentSubject) {
      const locator = this.currentSubject.__playwrightLocator || this.currentSubject;
      await locator.clear(options as any);
    } else {
      throw new Error('clear() requires a subject. Use cy.get(selector).clear() instead.');
    }
  }

  private async submit(): Promise<void> {
    if (this.currentSubject) {
      const locator = this.currentSubject.__playwrightLocator || this.currentSubject;
      await locator.evaluate((el: any) => el.form?.submit());
    } else {
      throw new Error('submit() requires a subject. Use cy.get(selector).submit() instead.');
    }
  }

  private async check(valuesOrOptions?: string | string[] | Partial<CheckClearOptions>, options?: Partial<CheckClearOptions>): Promise<void> {
    const values = Array.isArray(valuesOrOptions) ? valuesOrOptions : (typeof valuesOrOptions === 'string' ? [valuesOrOptions] : undefined);
    const checkOptions = typeof valuesOrOptions === 'object' && !Array.isArray(valuesOrOptions) ? valuesOrOptions : options;

    if (this.currentSubject) {
      const locator = this.currentSubject.__playwrightLocator || this.currentSubject;
      if (values?.length) {
        for (const value of values) {
          await locator.check({ value, ...checkOptions } as any);
        }
      } else {
        await locator.check(checkOptions as any);
      }
    } else {
      throw new Error('check() requires a subject. Use cy.get(selector).check() instead.');
    }
  }

  private async uncheck(valuesOrOptions?: string | string[] | Partial<CheckClearOptions>, options?: Partial<CheckClearOptions>): Promise<void> {
    const values = Array.isArray(valuesOrOptions) ? valuesOrOptions : (typeof valuesOrOptions === 'string' ? [valuesOrOptions] : undefined);
    const uncheckOptions = typeof valuesOrOptions === 'object' && !Array.isArray(valuesOrOptions) ? valuesOrOptions : options;

    if (this.currentSubject) {
      const locator = this.currentSubject.__playwrightLocator || this.currentSubject;
      if (values?.length) {
        for (const value of values) {
          await locator.uncheck({ value, ...uncheckOptions } as any);
        }
      } else {
        await locator.uncheck(uncheckOptions as any);
      }
    } else {
      throw new Error('uncheck() requires a subject. Use cy.get(selector).uncheck() instead.');
    }
  }

  private async select(valueOrTextOrOptions: string | string[] | Partial<SelectOptions>, textOrOptions?: string | Partial<SelectOptions>, options?: Partial<SelectOptions>): Promise<void> {
    let values: string | string[];
    let selectOptions: any = {};

    if (this.currentSubject) {
      // Chained form: cy.get('select').select('value') or .select(['v1', 'v2'], options)
      if (Array.isArray(valueOrTextOrOptions)) {
        values = valueOrTextOrOptions;
        selectOptions = typeof textOrOptions === 'object' ? textOrOptions : {};
      } else {
        values = String(valueOrTextOrOptions);
        selectOptions = typeof textOrOptions === 'object' ? textOrOptions : {};
      }
      const locator = this.currentSubject.__playwrightLocator || this.currentSubject;
      await locator.selectOption(values, selectOptions);
      return;
    }

    // Root form: cy.select(selector, value) - not common, but handle
    if (typeof valueOrTextOrOptions === 'string' && textOrOptions !== undefined) {
      values = typeof textOrOptions === 'string' ? textOrOptions : (Array.isArray(textOrOptions) ? textOrOptions : String(textOrOptions));
      selectOptions = typeof options === 'object' ? options : {};
      await this.getLocator(valueOrTextOrOptions).selectOption(values, selectOptions);
    } else {
      throw new Error('select() requires a subject. Use cy.get(selector).select(value) instead.');
    }
  }

  private async hover(options?: Partial<{ log?: boolean; timeout?: number; force?: boolean }>): Promise<void> {
    if (this.currentSubject) {
      const locator = this.currentSubject.__playwrightLocator || this.currentSubject;
      await locator.hover(options as any);
    } else {
      throw new Error('hover() requires a subject. Use cy.get(selector).hover() instead.');
    }
  }

  private async rightclick(positionOrOptions?: PositionType | Partial<ClickOptions>, xOrOptions?: number | Partial<ClickOptions>, options?: Partial<ClickOptions>): Promise<void> {
    const hasSubject = this.currentSubject && typeof this.currentSubject.click === 'function';
    const locator = hasSubject ? (this.currentSubject.__playwrightLocator || this.currentSubject) : undefined;

    if (!locator) {
      throw new Error('rightclick() requires a subject. Use cy.get(selector).rightclick() instead.');
    }

    const rightClickOptions: any = { button: 'right' };
    if (options?.force) rightClickOptions.force = true;

    if (typeof positionOrOptions === 'string' && this.isPositionType(positionOrOptions)) {
      const posOptions = typeof xOrOptions === 'object' ? { ...rightClickOptions, ...xOrOptions } : rightClickOptions;
      await locator.click({ position: this.mapPosition(positionOrOptions), ...posOptions });
    } else if (typeof positionOrOptions === 'number') {
      const x = positionOrOptions;
      const y = typeof xOrOptions === 'number' ? xOrOptions : 0;
      const coordOptions = typeof xOrOptions === 'object' ? { ...rightClickOptions, ...xOrOptions } : options ? { ...rightClickOptions, ...options } : rightClickOptions;
      await locator.click({ position: { x, y }, ...coordOptions });
    } else if (typeof positionOrOptions === 'object') {
      await locator.click({ ...rightClickOptions, ...positionOrOptions });
    } else {
      await locator.click(rightClickOptions);
    }
  }

  private async dblclick(positionOrOptions?: PositionType | Partial<ClickOptions>, xOrOptions?: number | Partial<ClickOptions>, options?: Partial<ClickOptions>): Promise<void> {
    const hasSubject = this.currentSubject && typeof this.currentSubject.dblclick === 'function';
    const locator = hasSubject ? (this.currentSubject.__playwrightLocator || this.currentSubject) : undefined;

    if (!locator) {
      throw new Error('dblclick() requires a subject. Use cy.get(selector).dblclick() instead.');
    }

    const dblClickOptions: any = {};
    if (options?.force) dblClickOptions.force = true;

    if (typeof positionOrOptions === 'string' && this.isPositionType(positionOrOptions)) {
      const posOptions = typeof xOrOptions === 'object' ? { ...dblClickOptions, ...xOrOptions } : dblClickOptions;
      await locator.dblclick({ position: this.mapPosition(positionOrOptions), ...posOptions });
    } else if (typeof positionOrOptions === 'number') {
      const x = positionOrOptions;
      const y = typeof xOrOptions === 'number' ? xOrOptions : 0;
      const coordOptions = typeof xOrOptions === 'object' ? { ...dblClickOptions, ...xOrOptions } : options ? { ...dblClickOptions, ...options } : dblClickOptions;
      await locator.dblclick({ position: { x, y }, ...coordOptions });
    } else if (typeof positionOrOptions === 'object') {
      await locator.dblclick({ ...dblClickOptions, ...positionOrOptions });
    } else {
      await locator.dblclick(dblClickOptions);
    }
  }

  private async scrollIntoView(options?: Partial<ScrollIntoViewOptions>): Promise<any> {
    let locator = this.currentSubject?.__playwrightLocator || this.currentSubject;

    if (!locator) {
      throw new Error('scrollIntoView requires a subject. Use cy.get(selector).scrollIntoView() instead.');
    }

    if (locator.__playwrightLocator) {
      locator = locator.__playwrightLocator;
    }

    // Playwright's scrollIntoViewIfNeeded handles most cases
    // For offset support, we'd need evaluate-based scrolling (partially supported)
    if (options?.offset) {
      await locator.evaluate((el: any, offset: any) => {
        el.scrollIntoView({ behavior: 'instant' });
        if (offset.top) window.scrollBy(0, offset.top);
        if (offset.left) window.scrollBy(offset.left, 0);
      }, options.offset);
    } else {
      await locator.scrollIntoViewIfNeeded();
    }

    return this.currentSubject;
  }

  private async scrollTo(positionOrX: PositionType | number | string | Partial<ScrollToOptions>, yOrOptions?: number | Partial<ScrollToOptions>, options?: Partial<ScrollToOptions>): Promise<void> {
    if (typeof positionOrX === 'string' && this.isPositionType(positionOrX)) {
      // scrollTo('topLeft') etc.
      const pos = this.mapPosition(positionOrX);
      await this.context.page.evaluate((coords: any) => window.scrollTo(coords.x, coords.y), pos);
    } else if (typeof positionOrX === 'number' && typeof yOrOptions === 'number') {
      // scrollTo(x, y)
      await this.context.page.evaluate((coords: any) => window.scrollTo(coords[0], coords[1]), [positionOrX, yOrOptions]);
    } else if (typeof positionOrX === 'number' && (typeof yOrOptions === 'object' || yOrOptions === undefined)) {
      // scrollTo(x) or scrollTo(x, options) - scroll horizontally only
      await this.context.page.evaluate((x: any) => window.scrollTo(x, window.scrollY), positionOrX);
    } else if (typeof positionOrX === 'string' && positionOrX.includes('%')) {
      // scrollTo('50%', '50%')
      const parsePercent = (val: string) => {
        const num = parseFloat(val);
        return isNaN(num) ? 0 : num / 100;
      };
      const xPct = parsePercent(positionOrX);
      const yPct = typeof yOrOptions === 'string' ? parsePercent(yOrOptions) : 0;
      await this.context.page.evaluate((pcts: any) => {
        const body = document.documentElement || document.body;
        window.scrollTo(
          (body.scrollWidth - window.innerWidth) * pcts.x,
          (body.scrollHeight - window.innerHeight) * pcts.y
        );
      }, { x: xPct, y: yPct });
    } else {
      // Default scroll to top
      await this.context.page.evaluate(() => window.scrollTo(0, 0));
    }
  }

  private async trigger(eventName: string, positionOrOptions?: PositionType | Partial<TriggerOptions>, xOrOptions?: number | Partial<TriggerOptions>, options?: Partial<TriggerOptions>): Promise<void> {
    const hasSubject = this.currentSubject && (this.currentSubject.__playwrightLocator || this.currentSubject.evaluate);
    const locator = hasSubject ? (this.currentSubject.__playwrightLocator || this.currentSubject) : undefined;

    if (!locator) {
      throw new Error('trigger() requires a subject. Use cy.get(selector).trigger(eventName) instead.');
    }

    let eventData: any = {};
    let triggerOpts: any = {};

    if (typeof positionOrOptions === 'object' && !this.isPositionType(positionOrOptions as any)) {
      // trigger(eventName, options) with event data
      const opts = positionOrOptions as any;
      // Extract event constructor properties from options (bubbles, cancelable, etc.)
      // Remaining keys become event detail/data
      const { bubbles, cancelable, eventConstructor, ...data } = opts;
      triggerOpts = { bubbles, cancelable, eventConstructor };
      eventData = data;
    } else if (typeof positionOrOptions === 'string' && this.isPositionType(positionOrOptions)) {
      triggerOpts.position = this.mapPosition(positionOrOptions);
      if (typeof xOrOptions === 'object') { Object.assign(triggerOpts, xOrOptions); }
    } else if (typeof positionOrOptions === 'number') {
      const x = positionOrOptions;
      const y = typeof xOrOptions === 'number' ? xOrOptions : 0;
      triggerOpts.position = { x, y };
      if (typeof xOrOptions === 'object') { Object.assign(triggerOpts, xOrOptions); }
      if (options && typeof options === 'object') { Object.assign(triggerOpts, options); }
    }

    await locator.evaluate((el: any, data: any) => {
      const EventConstructor = (window as any)[data.eventConstructor || 'Event'];
      const event = new EventConstructor(data.eventName, {
        bubbles: data.bubbles ?? true,
        cancelable: data.cancelable ?? true,
      });
      // Copy custom properties to event
      Object.assign(event, data.eventData);
      el.dispatchEvent(event);
    }, { eventName, eventConstructor: triggerOpts.eventConstructor, bubbles: triggerOpts.bubbles, cancelable: triggerOpts.cancelable, eventData: eventData });
  }
}
