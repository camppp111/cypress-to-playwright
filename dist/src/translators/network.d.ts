import { Page, BrowserContext } from '@playwright/test';
import { CommandTranslatorProperties } from './properties';
export declare class CommandTranslatorNetwork extends CommandTranslatorProperties {
    constructor(page: Page, context?: BrowserContext);
    private intercept;
    private as;
    private request;
}
