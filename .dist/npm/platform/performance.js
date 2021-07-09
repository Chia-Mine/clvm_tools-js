"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.now = void 0;
function now() {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { performance } = require("perf_hooks");
    return performance.now();
}
exports.now = now;
