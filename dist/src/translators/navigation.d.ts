import { Page, BrowserContext } from '@playwright/test';
import { CommandTranslatorBase } from './base';
export declare class CommandTranslatorNavigation extends CommandTranslatorBase {
    constructor(page: Page, context?: BrowserContext);
    private visit;
    private viewport;
    private reload;
    private go;
    private url;
    private title;
    private location;
    private screenshot;
    private wait;
    private log;
    private window;
    private document;
}
