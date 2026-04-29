import { Page, BrowserContext } from '@playwright/test';
import { CommandTranslatorNetwork } from './network';
export declare class CommandTranslatorScope extends CommandTranslatorNetwork {
    constructor(page: Page, context?: BrowserContext);
    /**
     * Sets up the within-scope chain so subsequent selector-based commands
     * are scoped to the current subject.
     *
     * NOTE: The actual callback execution is handled by the proxy layer
     * (CypressCommandProxy), which collects commands inside the callback
     * and enqueues them after this scope-setup command.
     * The `_callback` parameter is never passed by the proxy.
     */
    private within;
    private resetWithinScope;
}
