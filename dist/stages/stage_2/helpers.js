"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.brun = exports.run = exports.evaluate = exports.quote = exports.APPLY_ATOM = exports.QUOTE_ATOM = void 0;
const clvm_1 = require("clvm");
const NodePath_1 = require("../../clvm_tools/NodePath");
exports.QUOTE_ATOM = clvm_1.KEYWORD_TO_ATOM["q"];
exports.APPLY_ATOM = clvm_1.KEYWORD_TO_ATOM["a"];
function quote(sexp) {
    // quoted list as a python list, not as an sexp
    return clvm_1.t(clvm_1.h(exports.QUOTE_ATOM), sexp);
}
exports.quote = quote;
// In original python code, the name of this function is `eval`,
// but since the name `eval` cannot be used in typescript context, change the name to `evaluate`.
function evaluate(prog, args) {
    return clvm_1.SExp.to([clvm_1.h(exports.APPLY_ATOM), prog, args]);
}
exports.evaluate = evaluate;
function run(prog, macro_lookup) {
    /*
      PROG => (e (com (q . PROG) (mac)) ARGS)
      
      The result can be evaluated with the stage_com eval
      function.
     */
    const args = NodePath_1.TOP.as_path();
    const mac = quote(macro_lookup);
    return evaluate(clvm_1.SExp.to([clvm_1.b("com"), prog, mac]), args);
}
exports.run = run;
function brun(prog, args) {
    return evaluate(clvm_1.SExp.to(quote(prog)), quote(args));
}
exports.brun = brun;
