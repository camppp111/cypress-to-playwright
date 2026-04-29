import { Page, Browser, BrowserContext } from '@playwright/test';
export interface CypressCommand {
    command: string;
    args: any[];
    chainable: boolean;
}
export interface PlaywrightCommand {
    method: string;
    args: any[];
}
export interface CypressChain {
    [key: string]: (...args: any[]) => CypressChain;
}
export interface TranslatorContext {
    page: Page;
    browser?: Browser;
    context?: BrowserContext;
}
