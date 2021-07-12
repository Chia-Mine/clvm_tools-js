"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.printError = exports.setStderr = exports.print = exports.setStdout = void 0;
let printer = console.log;
let errPrinter = console.error;
function setStdout(p) {
    printer = p;
}
exports.setStdout = setStdout;
function print(message) {
    printer(message);
}
exports.print = print;
function setStderr(p) {
    errPrinter = p;
}
exports.setStderr = setStderr;
function printError(message) {
    errPrinter(message);
}
exports.printError = printError;
