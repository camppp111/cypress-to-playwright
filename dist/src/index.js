"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.xit = exports.xdescribe = exports.setupCypressGlobals = exports.CypressCommandProxy = exports.CommandTranslator = void 0;
exports.setupCypressToPlaywright = setupCypressToPlaywright;
const cypress_translator_1 = require("./cypress-translator");
const proxy_1 = require("./proxy");
function setupCypressToPlaywright(page, context) {
    const translator = new cypress_translator_1.CommandTranslator(page, context);
    const existingProxy = globalThis.__cypressCommandProxy;
    if (existingProxy) {
        existingProxy.setTranslator(translator, page);
        return existingProxy.createCypressProxy();
    }
    const proxy = new proxy_1.CypressCommandProxy(translator, page);
    globalThis.__cypressCommandProxy = proxy;
    return proxy.createCypressProxy();
}
var cypress_translator_2 = require("./cypress-translator");
Object.defineProperty(exports, "CommandTranslator", { enumerable: true, get: function () { return cypress_translator_2.CommandTranslator; } });
var proxy_2 = require("./proxy");
Object.defineProperty(exports, "CypressCommandProxy", { enumerable: true, get: function () { return proxy_2.CypressCommandProxy; } });
var setup_globals_1 = require("./setup-globals");
Object.defineProperty(exports, "setupCypressGlobals", { enumerable: true, get: function () { return setup_globals_1.setupCypressGlobals; } });
var mocha_translator_1 = require("./mocha-translator");
Object.defineProperty(exports, "describe", { enumerable: true, get: function () { return mocha_translator_1.describe; } });
Object.defineProperty(exports, "context", { enumerable: true, get: function () { return mocha_translator_1.context; } });
Object.defineProperty(exports, "it", { enumerable: true, get: function () { return mocha_translator_1.it; } });
Object.defineProperty(exports, "before", { enumerable: true, get: function () { return mocha_translator_1.before; } });
Object.defineProperty(exports, "after", { enumerable: true, get: function () { return mocha_translator_1.after; } });
Object.defineProperty(exports, "beforeEach", { enumerable: true, get: function () { return mocha_translator_1.beforeEach; } });
Object.defineProperty(exports, "afterEach", { enumerable: true, get: function () { return mocha_translator_1.afterEach; } });
Object.defineProperty(exports, "xdescribe", { enumerable: true, get: function () { return mocha_translator_1.xdescribe; } });
Object.defineProperty(exports, "xit", { enumerable: true, get: function () { return mocha_translator_1.xit; } });
