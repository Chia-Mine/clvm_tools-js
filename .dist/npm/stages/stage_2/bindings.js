"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.brun = void 0;
const binutils = require("../../clvm_tools/binutils");
exports.brun = binutils.assemble("(a 2 3)");
exports.run = binutils.assemble("(a (opt (com 2)) 3)");
