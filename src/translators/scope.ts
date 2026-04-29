import { Page, BrowserContext } from '@playwright/test';
import { CommandTranslatorNetwork } from './network';

export class CommandTranslatorScope extends CommandTranslatorNetwork {
  constructor(page: Page, context?: BrowserContext) {
    super(page, context);
    Object.assign(this.methodMap, {
      within: this.within.bind(this),
      resetWithinScope: this.resetWithinScope.bind(this),
    });
  }

  /**
   * Sets up the within-scope chain so subsequent selector-based commands
   * are scoped to the current subject.
   *
   * NOTE: The actual callback execution is handled by the proxy layer
   * (CypressCommandProxy), which collects commands inside the callback
   * and enqueues them after this scope-setup command.
   * The `_callback` parameter is never passed by the proxy.
   */
  private async within(_callback: (value: any) => Promise<void> | void): Promise<any> {
    const unwrappedSubject = this.currentSubject?.__playwrightLocator || this.currentSubject;
    this.withinSubjectChain.push(unwrappedSubject);

    // Scope persists for subsequent commands; proxy enqueues
    // resetWithinScope after the collected command block ends.
    return this.currentSubject;
  }

  private async resetWithinScope(): Promise<void> {
    this.withinSubjectChain.pop();
  }
}
