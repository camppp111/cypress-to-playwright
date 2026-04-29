import { setupCypressToPlaywright } from './index';

declare global {
  const cy: ReturnType<typeof setupCypressToPlaywright>;

  namespace Cypress {
    function config(attr?: string): any;
    function log(options: any): void;
    namespace Commands {
      function add(name: string, fn: (...args: any[]) => any): void;
      function add(name: string, options: any, fn: (...args: any[]) => any): void;
      function overwrite(name: string, fn: (...args: any[]) => any): void;
    }
  }

  function describe(name: string, callback: (fixtures?: any) => void | Promise<void>): void;
  function describe(name: string, options: any, callback: (fixtures?: any) => void | Promise<void>): void;
  function context(name: string, callback: (fixtures?: any) => void | Promise<void>): void;
  function context(name: string, options: any, callback: (fixtures?: any) => void | Promise<void>): void;
  function it(name: string, callback: (fixtures?: any) => void | Promise<void>): void;
  function it(name: string, options: any, callback: (fixtures?: any) => void | Promise<void>): void;
  function before(callback: (fixtures?: any) => void | Promise<void>): void;
  function after(callback: (fixtures?: any) => void | Promise<void>): void;
  function beforeEach(callback: (fixtures?: any) => void | Promise<void>): void;
  function afterEach(callback: (fixtures?: any) => void | Promise<void>): void;

  function expect(value: any): any;
}

export {};
