/**
 * Type definitions that mirror Cypress command options.
 * These are modeled after the real Cypress API to provide
 * standardized method signatures in the translator.
 */
export type PositionType = 'topLeft' | 'top' | 'topRight' | 'left' | 'center' | 'right' | 'bottomLeft' | 'bottom' | 'bottomRight';
export interface Loggable {
    log?: boolean;
}
export interface Timeoutable {
    timeout?: number;
}
export interface Forceable {
    force?: boolean;
}
export interface ActionableOptions extends Forceable {
    scrollBehavior?: 'center' | 'top' | 'bottom' | 'nearest' | false;
}
export interface VisitOptions extends Loggable, Timeoutable {
    url?: string;
    method?: 'GET' | 'POST';
    body?: any;
    headers?: {
        [header: string]: string;
    };
    auth?: {
        username: string;
        password: string;
    };
    qs?: object;
    onBeforeLoad?(win: any): void;
    onLoad?(win: any): void;
    failOnStatusCode?: boolean;
}
export interface ClickOptions extends Loggable, Timeoutable, ActionableOptions {
    multiple?: boolean;
    ctrlKey?: boolean;
    controlKey?: boolean;
    altKey?: boolean;
    shiftKey?: boolean;
    metaKey?: boolean;
}
export interface TypeOptions extends Loggable, Timeoutable, ActionableOptions {
    delay?: number;
    parseSpecialCharSequences?: boolean;
    release?: boolean;
}
export interface CheckClearOptions extends Loggable, Timeoutable, ActionableOptions {
}
export interface SelectOptions extends Loggable, Timeoutable, Forceable {
    interval?: number;
}
export interface TriggerOptions extends Loggable, Timeoutable, ActionableOptions {
    bubbles?: boolean;
    cancelable?: boolean;
    eventConstructor?: string;
    [key: string]: any;
}
export interface ScrollToOptions extends Loggable, Timeoutable {
    duration?: number | string;
    easing?: 'swing' | 'linear';
    ensureScrollable?: boolean;
}
export interface ScrollIntoViewOptions extends ScrollToOptions {
    offset?: {
        top?: number;
        left?: number;
    };
}
export interface ScreenshotOptions extends Loggable, Timeoutable {
    blackout?: string[];
    capture?: 'fullPage' | 'viewport' | 'runner';
    clip?: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    disableTimersAndAnimations?: boolean;
    overwrite?: boolean;
    padding?: number | number[];
    scale?: boolean;
    onBeforeScreenshot?: ($el: any) => void;
    onAfterScreenshot?: ($el: any) => void;
}
export interface WaitOptions extends Loggable, Timeoutable {
    requestTimeout?: number;
    responseTimeout?: number;
}
export interface RequestOptions extends Loggable, Timeoutable {
    url?: string;
    method?: string;
    body?: any;
    headers?: {
        [header: string]: string;
    };
    qs?: object;
    auth?: {
        username: string;
        password: string;
    };
    failOnStatusCode?: boolean;
    followRedirect?: boolean;
    gzip?: boolean;
    form?: boolean;
}
export interface ContainsOptions extends Loggable, Timeoutable {
    matchCase?: boolean;
    includeShadowDom?: boolean;
}
export interface GetOptions extends Loggable, Timeoutable {
    includeShadowDom?: boolean;
    withinSubject?: any;
}
