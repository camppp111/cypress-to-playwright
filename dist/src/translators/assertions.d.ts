import { Page, BrowserContext } from '@playwright/test';
import { CommandTranslatorTraversal } from './traversal';
export declare class CommandTranslatorAssertions extends CommandTranslatorTraversal {
    constructor(page: Page, context?: BrowserContext);
    private should;
    private and;
}
