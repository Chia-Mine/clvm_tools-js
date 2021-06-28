"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uncurry = exports.UNCURRY_PATTERN_CORE = exports.UNCURRY_PATTERN_FUNCTION = exports.curry = exports.CURRY_OBJ_CODE = void 0;
const binutils_1 = require("./binutils");
const stage_0_1 = require("../stages/stage_0");
const pattern_match_1 = require("./pattern_match");
const clvm_1 = require("clvm");
/*
# CURRY_OBJ_CODE contains compiled code from the output of the following:
# run -i clvm_runtime '(mod (F . args) (include curry.clvm) (curry_args F args))'

# the text below has been hand-optimized to replace `((c (q X) Y))` with `(a (q X) Y)`
# and `(q 0)` with `0`
 */
exports.CURRY_OBJ_CODE = binutils_1.assemble(
// eslint-disable-next-line max-len
"(a (q #a 4 (c 2 (c 5 (c 7 0)))) (c (q (c (q . 2) (c (c (q . 1) 5) (c (a 6 (c 2 (c 11 (q 1)))) 0))) #a (i 5 (q 4 (q . 4) (c (c (q . 1) 9) (c (a 6 (c 2 (c 13 (c 11 0)))) 0))) (q . 11)) 1) 1))");
function curry(program, args) {
    /*
      ;; A "curry" binds values to a function, making them constant,
      ;; and returning a new function that returns fewer arguments (since the
      ;; arguments are now fixed).
      ;; Example: (defun add2 (V1 V2) (+ V1 V2))  ; add two values
      ;; (curry add2 15) ; this yields a function that accepts ONE argument, and adds 15 to it
  
      `program`: an SExp
      `args`: an SExp that is a list of constants to be bound to `program`
     */
    args = clvm_1.SExp.to(clvm_1.t(program, args));
    return stage_0_1.run_program(exports.CURRY_OBJ_CODE, args);
}
exports.curry = curry;
exports.UNCURRY_PATTERN_FUNCTION = binutils_1.assemble("(a (q . (: . function)) (: . core))");
exports.UNCURRY_PATTERN_CORE = binutils_1.assemble("(c (q . (: . parm)) (: . core))");
function uncurry(curried_program) {
    const r = pattern_match_1.match(exports.UNCURRY_PATTERN_FUNCTION, curried_program);
    if (!r) {
        return r;
    }
    const f = r["function"];
    let core = r["core"];
    const args = [];
    // eslint-disable-next-line no-constant-condition
    while (true) {
        const r2 = pattern_match_1.match(exports.UNCURRY_PATTERN_CORE, core);
        if (!r2) {
            break;
        }
        args.push(r["parm"]);
        core = r["core"];
    }
    if (core.as_javascript().equal_to(clvm_1.h("0x01"))) {
        return clvm_1.t(f, clvm_1.SExp.to(args));
    }
    return clvm_1.None;
}
exports.uncurry = uncurry;
