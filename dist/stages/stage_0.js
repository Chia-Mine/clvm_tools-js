"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run_program = exports.brun = exports.run = void 0;
const clvm_1 = require("clvm");
const binutils = require("../clvm_tools/binutils");
exports.run = binutils.assemble("(a 2 3)");
exports.brun = exports.run;
function run_program(program, args, operator_lookup = clvm_1.OPERATOR_LOOKUP, max_cost = clvm_1.None, pre_eval_f = clvm_1.None, strict = false) {
    if (strict) {
        const fatal_error = (op, args) => {
            throw new clvm_1.EvalError("unimplemented operator", clvm_1.SExp.to(op));
        };
        operator_lookup = clvm_1.OperatorDict(operator_lookup, undefined, undefined, fatal_error);
    }
    return clvm_1.run_program(program, args, operator_lookup, max_cost, pre_eval_f);
}
exports.run_program = run_program;
