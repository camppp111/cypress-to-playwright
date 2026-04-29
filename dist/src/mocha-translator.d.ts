export declare class MochaTranslator {
    private testTitleMap;
    describe(name: string, callback: (fixtures?: any) => void | Promise<void>): void;
    describe(name: string, options: any, callback: (fixtures?: any) => void | Promise<void>): void;
    context(name: string, callback: (fixtures?: any) => void | Promise<void>): void;
    context(name: string, options: any, callback: (fixtures?: any) => void | Promise<void>): void;
    it(name: string, callback: (fixtures?: any) => void | Promise<void>): void;
    it(name: string, options: any, callback: (fixtures?: any) => void | Promise<void>): void;
    before(callback: (fixtures?: any) => void | Promise<void>): void;
    after(callback: (fixtures?: any) => void | Promise<void>): void;
    beforeEach(callback: (fixtures?: any) => void | Promise<void>): void;
    afterEach(callback: (fixtures?: any) => void | Promise<void>): void;
    xdescribe(name: string, callback: (fixtures?: any) => void | Promise<void>): void;
    xdescribe(name: string, options: any, callback: (fixtures?: any) => void | Promise<void>): void;
    xit(name: string, callback: (fixtures?: any) => void | Promise<void>): void;
    xit(name: string, options: any, callback: (fixtures?: any) => void | Promise<void>): void;
    expect(value: any): any;
}
export declare const mochaTranslator: MochaTranslator;
type DescribeFn = {
    (name: string, callback: (fixtures?: any) => void | Promise<void>): void;
    (name: string, options: any, callback: (fixtures?: any) => void | Promise<void>): void;
};
export declare const describe: DescribeFn;
type ContextFn = {
    (name: string, callback: (fixtures?: any) => void | Promise<void>): void;
    (name: string, options: any, callback: (fixtures?: any) => void | Promise<void>): void;
};
type ItFn = {
    (name: string, callback: (fixtures?: any) => void | Promise<void>): void;
    (name: string, options: any, callback: (fixtures?: any) => void | Promise<void>): void;
};
export declare const context: ContextFn;
export declare const it: ItFn;
export declare const before: (callback: (fixtures?: any) => void | Promise<void>) => void;
export declare const after: (callback: (fixtures?: any) => void | Promise<void>) => void;
export declare const beforeEach: (callback: (fixtures?: any) => void | Promise<void>) => void;
export declare const afterEach: (callback: (fixtures?: any) => void | Promise<void>) => void;
export declare const xdescribe: any;
export declare const xit: any;
export {};
