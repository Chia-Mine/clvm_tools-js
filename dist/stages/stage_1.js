"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run_program = exports.RunProgram = exports.brun = exports.run = exports.BINDINGS = exports.do_binding = exports.make_bindings = exports.make_invocation = void 0;
const clvm_1 = require("clvm");
const stage_0_1 = require("./stage_0");
const binutils = require("../clvm_tools/binutils");
function make_invocation(code) {
    return function invoke(args) {
        return exports.run_program(code, args);
    };
}
exports.make_invocation = make_invocation;
function make_bindings(bindings_sexp) {
    const binding_table = {};
    for (const pair of bindings_sexp.as_iter()) {
        const name = pair.first().atom;
        binding_table[name.hex()] = make_invocation(pair.rest().first());
    }
    return binding_table;
}
exports.make_bindings = make_bindings;
function do_binding(args) {
    if (args.as_javascript().length !== 3) {
        throw new SyntaxError("bind requires 3 arguments");
    }
    const bindings = args.first();
    const sexp = args.rest().first();
    const env = args.rest().rest().first();
    const new_bindings = make_bindings(bindings);
    const original_operator_lookup = exports.run_program.operator_lookup;
    exports.run_program.operator_lookup = clvm_1.OperatorDict(original_operator_lookup);
    merge(exports.run_program.operator_lookup, new_bindings);
    const [cost, r] = exports.run_program(sexp, env);
    exports.run_program.operator_lookup = original_operator_lookup;
    return clvm_1.t(cost, r);
}
exports.do_binding = do_binding;
exports.BINDINGS = {
    bind: do_binding,
};
exports.run = binutils.assemble("(a 2 3)");
exports.brun = exports.run;
function merge(obj1, obj2) {
    Object.keys(obj2).forEach(key => {
        obj1[key] = obj2[key];
    });
}
function RunProgram() {
    const operator_lookup = clvm_1.OperatorDict(clvm_1.OPERATOR_LOOKUP);
    const bindings_obj = {};
    Object.entries(exports.BINDINGS).forEach(([key, val]) => {
        const bin_name = clvm_1.b(key).hex(); // bind: 61696e64
        bindings_obj[bin_name] = val;
    });
    merge(operator_lookup, bindings_obj);
    const f = function (program, args, max_cost = clvm_1.None, pre_eval_f = clvm_1.None, strict = false) {
        return stage_0_1.run_program(program, args, operator_lookup, max_cost, pre_eval_f, strict);
    };
    f.operator_lookup = operator_lookup;
    return f;
}
exports.RunProgram = RunProgram;
exports.run_program = RunProgram();
