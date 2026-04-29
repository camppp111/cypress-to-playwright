import { Page, BrowserContext } from '@playwright/test';
import { TranslatorContext } from '../types';
export declare class CommandTranslatorBase {
    protected context: TranslatorContext;
    protected currentSubject: any;
    protected withinSubjectChain: any[];
    protected requestAliases: Map<string, Promise<any>>;
    protected lastInterceptId: string;
    protected methodMap: {
        [key: string]: (...args: any[]) => Promise<any>;
    };
    protected nonSubjectCommands: string[];
    constructor(page: Page, context?: BrowserContext);
    translate(command: string, args: any[], chainSubject?: any): Promise<any>;
    getCurrentSubject(): any;
    protected getPlaywrightMethod(command: string): ((...args: any[]) => Promise<any>) | null;
    protected getLocator(selector: string): any;
    createJQueryWrapper(element: any, forceSingle?: boolean): Promise<any>;
    protected typeText(locator: any, text: string): Promise<void>;
    protected isHttpMethod(value: string): boolean;
}
