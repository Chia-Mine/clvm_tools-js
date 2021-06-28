"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.performance = exports.now = void 0;
function now() {
    return window.performance.now();
}
exports.now = now;
exports.performance = {
    now,
};
