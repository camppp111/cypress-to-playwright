import { Page, BrowserContext } from '@playwright/test';
import { CommandTranslatorNavigation } from './navigation';
export declare class CommandTranslatorInteraction extends CommandTranslatorNavigation {
    constructor(page: Page, context?: BrowserContext);
    private isPositionType;
    private mapPosition;
    private click;
    private type;
    private focus;
    private blur;
    private clear;
    private submit;
    private check;
    private uncheck;
    private select;
    private hover;
    private rightclick;
    private dblclick;
    private scrollIntoView;
    private scrollTo;
    private trigger;
}
