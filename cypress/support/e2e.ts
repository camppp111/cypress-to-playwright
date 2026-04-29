/// <reference path="../../src/globals.d.ts" />

// ***********************************************************
// This support file is loaded before every test.
//
// We inject Cypress-style globals (describe, it, cy, expect, Cypress)
// into globalThis so existing Cypress spec files can run under
// Playwright without any rewrites.
// ***********************************************************

import config from '../../playwright.config';
import { setupCypressGlobals } from '../../src/setup-globals';

// Inject Cypress-style globals into globalThis
setupCypressGlobals(config);

// Load all custom Cypress commands so they are available in every test.
// Use require() instead of import so it executes after the globals are set up.
require('./commands');