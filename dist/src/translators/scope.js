"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandTranslatorScope = void 0;
const network_1 = require("./network");
class CommandTranslatorScope extends network_1.CommandTranslatorNetwork {
    constructor(page, context) {
        super(page, context);
        Object.assign(this.methodMap, {
            within: this.within.bind(this),
            resetWithinScope: this.resetWithinScope.bind(this),
        });
    }
    /**
     * Sets up the within-scope chain so subsequent selector-based commands
     * are scoped to the current subject.
     *
     * NOTE: The actual callback execution is handled by the proxy layer
     * (CypressCommandProxy), which collects commands inside the callback
     * and enqueues them after this scope-setup command.
     * The `_callback` parameter is never passed by the proxy.
     */
    async within(_callback) {
        const unwrappedSubject = this.currentSubject?.__playwrightLocator || this.currentSubject;
        this.withinSubjectChain.push(unwrappedSubject);
        // Scope persists for subsequent commands; proxy enqueues
        // resetWithinScope after the collected command block ends.
        return this.currentSubject;
    }
    async resetWithinScope() {
        this.withinSubjectChain.pop();
    }
}
exports.CommandTranslatorScope = CommandTranslatorScope;
