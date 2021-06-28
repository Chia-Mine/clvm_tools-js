"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initialize = exports.setPrintFunction = void 0;
__exportStar(require("./clvm_tools/binutils"), exports);
__exportStar(require("./clvm_tools/clvmc"), exports);
__exportStar(require("./clvm_tools/cmds"), exports);
__exportStar(require("./clvm_tools/curry"), exports);
__exportStar(require("./clvm_tools/debug"), exports);
__exportStar(require("./clvm_tools/NodePath"), exports);
__exportStar(require("./clvm_tools/pattern_match"), exports);
__exportStar(require("./clvm_tools/sha256tree"), exports);
const print_1 = require("./__platform__/print");
const clvm_1 = require("clvm");
/**
 * Change print function. Default is `console.log`.
 * If you want to print messages to file, variable or something, you need to change printer function by this function.
 * @param {(...msg: string[]) => void} printer
 */
function setPrintFunction(printer) {
    print_1.setPrinter(printer);
}
exports.setPrintFunction = setPrintFunction;
/**
 * Wait BLS module to be initialized before you call any of `clvm_tools` functions.
 *
 * 'initialize()' here is not required if you're so sure it never calls 'pubkey_for_exp' or 'point_add' operation.
 * When one of those operations is called without prior 'await initialize()', it will raise an Error.
 * If it is unknown whether 'pubkey_for_exp' or 'point_add' will be called, then put 'await initialize()' for safety.
 * I know this 'await initialize()' makes code asynchronous and really impacts on code architecture.
 * This is because 'clvm' relies on a wasm of 'bls-signatures', which requires asynchronous loading.
 */
function initialize() {
    return __awaiter(this, void 0, void 0, function* () {
        return clvm_1.initialize();
    });
}
exports.initialize = initialize;
