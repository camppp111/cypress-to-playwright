"use strict";
/// <reference path="../../src/globals.d.ts" />
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// ***********************************************************
// This support file is loaded before every test.
//
// We inject Cypress-style globals (describe, it, cy, expect, Cypress)
// into globalThis so existing Cypress spec files can run under
// Playwright without any rewrites.
// ***********************************************************
const playwright_config_1 = __importDefault(require("../../playwright.config"));
const setup_globals_1 = require("../../src/setup-globals");
// Inject Cypress-style globals into globalThis
(0, setup_globals_1.setupCypressGlobals)(playwright_config_1.default);
// Load all custom Cypress commands so they are available in every test.
// Use require() instead of import so it executes after the globals are set up.
require('./commands');
