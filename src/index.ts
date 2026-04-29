import { Page, BrowserContext } from '@playwright/test';
import { CommandTranslator } from './cypress-translator';
import { CypressCommandProxy } from './proxy';

export function setupCypressToPlaywright(page: Page, context?: BrowserContext) {
  const translator = new CommandTranslator(page, context);

  const existingProxy = (globalThis as any).__cypressCommandProxy;
  if (existingProxy) {
    existingProxy.setTranslator(translator, page);
    return existingProxy.createCypressProxy();
  }

  const proxy = new CypressCommandProxy(translator, page);
  (globalThis as any).__cypressCommandProxy = proxy;
  return proxy.createCypressProxy();
}

export { CommandTranslator } from './cypress-translator';
export { CypressCommandProxy } from './proxy';
export { setupCypressGlobals } from './setup-globals';
export type { CypressCommand, PlaywrightCommand } from './types';
export {
  describe,
  context,
  it,
  before,
  after,
  beforeEach,
  afterEach,
  xdescribe,
  xit
} from './mocha-translator';
