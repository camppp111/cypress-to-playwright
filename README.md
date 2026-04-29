# cypress-to-playwright

A package that translates Cypress commands to Playwright equivalents at runtime. When imported, it provides a proxy that intercepts Cypress-style commands and executes them using Playwright's API.

> **Why?** Because enterprise migration consultants charge six figures to tell you to rewrite everything. This does it for you, automatically, at runtime — and yes, I built it for the memes. But it works. Seriously. Production-grade, fully typed, 103 integration tests passing, ready for `npm publish`. The memes just happened to be serious.

## Installation

```bash
npm install cypress-to-playwright
```

## Usage

### New Playwright tests, Cypress-style commands

```typescript
import { setupCypressToPlaywright } from 'cypress-to-playwright';
import { test, expect } from '@playwright/test';

test('example', async ({ page }) => {
  const cy = setupCypressToPlaywright(page);

  // Now use Cypress-style commands
  await cy.visit('https://example.com');
  await cy.get('button').click();
  await cy.get('input').type('hello');
});
```

### Existing Cypress specs — zero rewrites

If you already have a `cypress/` directory full of `*.spec.ts` files using `describe`, `it`, `cy.visit`, `cy.get`, etc., you can run them under Playwright without modifying a single test file.

Add this to your `playwright.config.ts`:

```typescript
import { defineConfig } from '@playwright/test';
import { setupCypressGlobals } from 'cypress-to-playwright';

setupCypressGlobals(); // Injects cy, describe, it, expect, Cypress into globalThis

export default defineConfig({
  testDir: './cypress', // or wherever your specs live
});
```

Then add this triple-slash directive at the top of any spec file that TypeScript complains about (or add it to a single `.d.ts` file in your project):

```typescript
/// <reference types="cypress-to-playwright/globals" />
```

Your existing spec files will just work:

```typescript
describe('Login', () => {
  it('should log in', () => {
    cy.visit('/login');
    cy.get('[data-testid=email]').type('user@example.com');
    cy.get('button').click();
    cy.url().should('include', '/dashboard');
  });
});
```

## Supported Cypress Commands

- **Navigation**: `visit`, `reload`, `go`, `url`, `title`, `window`, `viewport`, `log`
- **Selection**: `get`, `contains`, `find`, `findByTestId`, `findAllByTestId`, `document`
- **Interaction**: `click`, `type`, `clear`, `check`, `uncheck`, `select`, `hover`, `rightclick`, `dblclick`, `focus`, `blur`, `submit`, `trigger`
- **Scrolling**: `scrollIntoView`, `scrollTo`
- **Traversal**: `parent`, `children`, `siblings`, `closest`, `next`, `prev`, `nextAll`, `prevAll`, `parents`, `parentsUntil`, `eq`, `first`, `last`, `filter`, `not`, `is`, `has`
- **Assertions**: `should`, `and` — supports `eq`, `equal`, `eql`, `exist`, `visible`, `hidden`, `enabled`, `disabled`, `checked`, `selected`, `empty`, `focus`, `have.class`, `have.text`, `have.value`, `have.attr`, `have.prop`, `have.css`, `have.html`, `have.id`, `have.length`, `have.descendants`, `contain`, `include`, `match`, `gt`, `gte`, `lt`, `lte`, `within`, `closeTo`, `oneOf`, `instanceOf`, `keys`, `above`, `below`, `members`, `satisfy`, `a`, `an`, `true`, `false`, `null`, `undefined`, `NaN`, `ok`, `truthy`, `deep.equal`
- **Network**: `intercept`, `as`, `request`
- **Scope**: `within`, `resetWithinScope`
- **Properties**: `its`, `invoke`, `wrap`, `config`, `prop`, `hasClass`, `length`
- **Utilities**: `wait`, `screenshot`, `then`, `each`

## Supported Mocha Functions

The package also translates Mocha test structure functions to Playwright equivalents:

- `describe(name, callback)` - Test suite grouping
- `context(name, callback)` - Alias for describe
- `it(name, callback)` - Individual test case
- `before(callback)` - Setup before all tests
- `after(callback)` - Teardown after all tests
- `beforeEach(callback)` - Setup before each test
- `afterEach(callback)` - Teardown after each test

### Example with Mocha

```typescript
import { describe, context, it, beforeEach, afterEach, setupCypressToPlaywright } from 'cypress-to-playwright';
import { expect } from '@playwright/test';
import { chromium } from '@playwright/test';

describe('My Test Suite', () => {
  let browser: any;
  let page: any;
  let cy: any;

  beforeEach(async () => {
    browser = await chromium.launch();
    page = await browser.newPage();
    cy = setupCypressToPlaywright(page);
  });

  afterEach(async () => {
    if (browser) await browser.close();
  });

  context('Navigation', () => {
    it('should visit a page', async () => {
      await cy.visit('https://example.com');
      const title = await page.title();
      expect(title).toContain('Example');
    });
  });
});
```

## Project Structure

```
src/
├── index.ts                    # Main entry point
├── cypress-translator.ts       # Re-exports the composed translator
├── proxy.ts                    # Proxy handler for command interception
├── mocha-translator.ts         # Mocha test structure translation
├── setup-globals.ts            # Injects cy, describe, it, expect, Cypress into globalThis
├── globals.d.ts                # Ambient type declarations for injected globals
└── translators/
    ├── base.ts                 # Shared state and utilities
    ├── navigation.ts           # visit, reload, go, url, title
    ├── interaction.ts          # click, type, clear, check, trigger
    ├── selection.ts            # get, contains, find
    ├── traversal.ts            # parent, children, siblings, closest, filter
    ├── assertions.ts           # should, and assertion chains
    ├── properties.ts           # its, invoke, wrap, config
    ├── network.ts              # intercept, as, request
    ├── scope.ts                # within scoping
    └── types.ts              # Cypress-compatible type definitions
```

## Development

```bash
npm install
npm run build      # Build the project
npm run dev        # Watch mode
npm test           # Run unit tests
npm run test:playwright  # Run integration tests
```

## Requirements

- Node.js >= 18.0.0
- `@playwright/test` >= 1.40.0 (peer dependency)
