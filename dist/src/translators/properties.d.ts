import { Page, BrowserContext } from '@playwright/test';
import { CommandTranslatorAssertions } from './assertions';
export declare class CommandTranslatorProperties extends CommandTranslatorAssertions {
    constructor(page: Page, context?: BrowserContext);
    private its;
    private hasClass;
    private length;
    private prop;
    private invoke;
    private wrap;
    private config;
}
