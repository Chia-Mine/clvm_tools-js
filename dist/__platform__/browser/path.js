"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolve = void 0;
function resolve(...paths) {
    return paths.join("/")
        .replace(/[?+*\[\]\\><]/g, "")
        .replace(/[/]+/g, "/")
        .replace(/[/]$/, "");
}
exports.resolve = resolve;
