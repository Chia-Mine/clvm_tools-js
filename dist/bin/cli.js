#!/usr/bin/env node
"use strict";
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
const __1 = require("../");
const cmds_1 = require("../clvm_tools/cmds");
const COMMANDS = {
    read_ir: cmds_1.read_ir,
    opc: cmds_1.opc,
    opd: cmds_1.opd,
    run: cmds_1.run,
    brun: cmds_1.brun,
};
main().catch(e => {
    console.error("Unexpected error");
    console.error(e);
});
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        if (process.argv.length < 3) {
            console.error("Insufficient argument");
            return;
        }
        const argv = process.argv.slice(2);
        const command = argv[0];
        if (!(command in COMMANDS)) {
            console.error(`Unknown command: ${command}`);
            return;
        }
        // Async load BLS modules
        yield __1.initialize();
        COMMANDS[command](argv);
    });
}
