import { Page, BrowserContext } from '@playwright/test';
import { CommandTranslatorSelection } from './selection';
export declare class CommandTranslatorTraversal extends CommandTranslatorSelection {
    constructor(page: Page, context?: BrowserContext);
    private parent;
    private closest;
    private next;
    private prev;
    private nextAll;
    private prevAll;
    private siblings;
    private children;
    private parents;
    private parentsUntil;
    private not;
    private is;
    private has;
    private filter;
}
