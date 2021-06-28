"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.print = exports.setPrinter = void 0;
let printer = console.log;
function setPrinter(p) {
    printer = p;
}
exports.setPrinter = setPrinter;
function print(message) {
    printer(message);
}
exports.print = print;
