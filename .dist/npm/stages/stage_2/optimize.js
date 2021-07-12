"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.make_do_opt = exports.optimize_sexp = exports.apply_null_optimizer = exports.APPLY_NULL_PATTERN_1 = exports.quote_null_optimizer = exports.QUOTE_PATTERN_1 = exports.path_optimizer = exports.REST_ATOM_PATTERN = exports.FIRST_ATOM_PATTERN = exports.cons_optimizer = exports.CONS_OPTIMIZER_PATTERN_REST = exports.CONS_OPTIMIZER_PATTERN_FIRST = exports.children_optimizer = exports.var_change_optimizer_cons_eval = exports.VAR_CHANGE_OPTIMIZER_CONS_EVAL_PATTERN = exports.sub_args = exports.path_from_args = exports.cons_r = exports.cons_f = exports.CONS_PATTERN = exports.cons_q_a_optimizer = exports.CONS_Q_A_OPTIMIZER_PATTERN = exports.is_args_call = exports.constant_optimizer = exports.seems_constant = exports.non_nil = exports.RAISE_ATOM = exports.CONS_ATOM = exports.REST_ATOM = exports.FIRST_ATOM = exports.APPLY_ATOM = exports.QUOTE_ATOM = void 0;
const clvm_1 = require("clvm");
const pattern_match_1 = require("../../clvm_tools/pattern_match");
const binutils_1 = require("../../clvm_tools/binutils");
const NodePath_1 = require("../../clvm_tools/NodePath");
const helpers_1 = require("./helpers");
const print_1 = require("../../platform/print");
exports.QUOTE_ATOM = clvm_1.KEYWORD_TO_ATOM["q"];
exports.APPLY_ATOM = clvm_1.KEYWORD_TO_ATOM["a"];
exports.FIRST_ATOM = clvm_1.KEYWORD_TO_ATOM["f"];
exports.REST_ATOM = clvm_1.KEYWORD_TO_ATOM["r"];
exports.CONS_ATOM = clvm_1.KEYWORD_TO_ATOM["c"];
exports.RAISE_ATOM = clvm_1.KEYWORD_TO_ATOM["x"];
const DEBUG_OPTIMIZATIONS = 0;
function non_nil(sexp) {
    return sexp.listp() || (sexp.atom && sexp.atom.length > 0);
}
exports.non_nil = non_nil;
function seems_constant(sexp) {
    if (!sexp.listp()) {
        // note that `0` is a constant
        return !non_nil(sexp);
    }
    const operator = sexp.first();
    if (!operator.listp()) {
        const atom = operator.atom && operator.atom.hex();
        if (atom === exports.QUOTE_ATOM) {
            return true;
        }
        else if (atom === exports.RAISE_ATOM) {
            return false;
        }
    }
    else if (!seems_constant(operator)) {
        return false;
    }
    for (const _ of sexp.rest().as_iter()) {
        if (!seems_constant(_)) {
            return false;
        }
    }
    return true;
}
exports.seems_constant = seems_constant;
function constant_optimizer(r, eval_f) {
    /*
      If the expression does not depend upon @ anywhere,
      it's a constant. So we can simply evaluate it and
      return the quoted result.
     */
    if (seems_constant(r) && non_nil(r)) {
        const [, r1] = eval_f(r, clvm_1.SExp.null());
        r = clvm_1.SExp.to(helpers_1.quote(r1));
    }
    return r;
}
exports.constant_optimizer = constant_optimizer;
function is_args_call(r) {
    return !r.listp() && r.as_int() === 1;
}
exports.is_args_call = is_args_call;
exports.CONS_Q_A_OPTIMIZER_PATTERN = binutils_1.assemble("(a (q . (: . sexp)) (: . args))");
function cons_q_a_optimizer(r, eval_f) {
    /*
      This applies the transform
      (a (q . SEXP) @) => SEXP
     */
    const t1 = pattern_match_1.match(exports.CONS_Q_A_OPTIMIZER_PATTERN, r);
    if (t1 && is_args_call(t1["args"])) {
        return t1["sexp"];
    }
    return r;
}
exports.cons_q_a_optimizer = cons_q_a_optimizer;
exports.CONS_PATTERN = binutils_1.assemble("(c (: . first) (: . rest)))");
function cons_f(args) {
    const t = pattern_match_1.match(exports.CONS_PATTERN, args);
    if (t) {
        return t["first"];
    }
    return clvm_1.SExp.to([clvm_1.h(exports.FIRST_ATOM), args]);
}
exports.cons_f = cons_f;
function cons_r(args) {
    const t = pattern_match_1.match(exports.CONS_PATTERN, args);
    if (t) {
        return t["rest"];
    }
    return clvm_1.SExp.to([clvm_1.h(exports.REST_ATOM), args]);
}
exports.cons_r = cons_r;
function path_from_args(sexp, new_args) {
    const v = sexp.as_int();
    if (v <= 1) {
        return new_args;
    }
    sexp = clvm_1.SExp.to(v >> 1);
    if (v & 1) {
        return path_from_args(sexp, cons_r(new_args));
    }
    return path_from_args(sexp, cons_f(new_args));
}
exports.path_from_args = path_from_args;
function sub_args(sexp, new_args) {
    if (sexp.nullp() || !sexp.listp()) {
        return path_from_args(sexp, new_args);
    }
    let first = sexp.first();
    if (first.listp()) {
        first = sub_args(first, new_args);
    }
    else {
        const op = first.atom;
        if (op.hex() === exports.QUOTE_ATOM) {
            return sexp;
        }
    }
    const args = [first];
    for (const _ of sexp.rest().as_iter()) {
        args.push(sub_args(_, new_args));
    }
    return clvm_1.SExp.to(args);
}
exports.sub_args = sub_args;
exports.VAR_CHANGE_OPTIMIZER_CONS_EVAL_PATTERN = binutils_1.assemble("(a (q . (: . sexp)) (: . args))");
function var_change_optimizer_cons_eval(r, eval_f) {
    /*
      This applies the transform
      (a (q . (op SEXP1...)) (ARGS)) => (q . RET_VAL) where ARGS != @
      via
      (op (a SEXP1 (ARGS)) ...) (ARGS)) and then "children_optimizer" of this.
      In some cases, this can result in a constant in some of the children.
  
      If we end up needing to push the "change of variables" to only one child, keep
      the optimization. Otherwise discard it.
     */
    const t1 = pattern_match_1.match(exports.VAR_CHANGE_OPTIMIZER_CONS_EVAL_PATTERN, r);
    if (t1 === clvm_1.None) {
        return r;
    }
    const original_args = t1["args"];
    const original_call = t1["sexp"];
    const new_eval_sexp_args = sub_args(original_call, original_args);
    // Do not iterate into a quoted value as if it were a list
    if (seems_constant(new_eval_sexp_args)) {
        const opt_operands = optimize_sexp(new_eval_sexp_args, eval_f);
        return clvm_1.SExp.to(opt_operands);
    }
    const new_operands = [];
    for (const item of new_eval_sexp_args.as_iter()) {
        new_operands.push(item);
    }
    const opt_operands = new_operands.map(_ => optimize_sexp(_, eval_f));
    const non_constant_count = opt_operands.reduce((acc, val) => {
        return acc + (val.listp() && !val.first().equal_to(clvm_1.h(exports.QUOTE_ATOM)) ? 1 : 0);
    }, 0);
    if (non_constant_count < 1) {
        return clvm_1.SExp.to(opt_operands);
    }
    return r;
}
exports.var_change_optimizer_cons_eval = var_change_optimizer_cons_eval;
function children_optimizer(r, eval_f) {
    // Recursively apply optimizations to all non-quoted child nodes.
    if (!r.listp()) {
        return r;
    }
    const operator = r.first();
    if (!operator.listp()) {
        const op = operator.atom;
        if (op.hex() === exports.QUOTE_ATOM) {
            return r;
        }
    }
    const optimized = [];
    for (const _ of r.as_iter()) {
        optimized.push(optimize_sexp(_, eval_f));
    }
    return clvm_1.SExp.to(optimized);
}
exports.children_optimizer = children_optimizer;
exports.CONS_OPTIMIZER_PATTERN_FIRST = binutils_1.assemble("(f (c (: . first) (: . rest)))");
exports.CONS_OPTIMIZER_PATTERN_REST = binutils_1.assemble("(r (c (: . first) (: . rest)))");
function cons_optimizer(r, eval_f) {
    /*
      This applies the transform
      (f (c A B)) => A
      and
      (r (c A B)) => B
     */
    let t1 = pattern_match_1.match(exports.CONS_OPTIMIZER_PATTERN_FIRST, r);
    if (t1) {
        return t1["first"];
    }
    t1 = pattern_match_1.match(exports.CONS_OPTIMIZER_PATTERN_REST, r);
    if (t1) {
        return t1["rest"];
    }
    return r;
}
exports.cons_optimizer = cons_optimizer;
exports.FIRST_ATOM_PATTERN = binutils_1.assemble("(f ($ . atom))");
exports.REST_ATOM_PATTERN = binutils_1.assemble("(r ($ . atom))");
function path_optimizer(r, eval_f) {
    /*
      This applies the transform
      (f N) => A
      and
      (r N) => B
     */
    let t1 = pattern_match_1.match(exports.FIRST_ATOM_PATTERN, r);
    if (t1 && non_nil(t1["atom"])) {
        let node = new NodePath_1.NodePath(t1["atom"].as_int());
        node = node.add(NodePath_1.LEFT);
        return clvm_1.SExp.to(node.as_short_path());
    }
    t1 = pattern_match_1.match(exports.REST_ATOM_PATTERN, r);
    if (t1 && non_nil(t1["atom"])) {
        let node = new NodePath_1.NodePath(t1["atom"].as_int());
        node = node.add(NodePath_1.RIGHT);
        return clvm_1.SExp.to(node.as_short_path());
    }
    return r;
}
exports.path_optimizer = path_optimizer;
exports.QUOTE_PATTERN_1 = binutils_1.assemble("(q . 0)");
function quote_null_optimizer(r, eval_f) {
    // This applies the transform `(q . 0)` => `0`
    const t1 = pattern_match_1.match(exports.QUOTE_PATTERN_1, r);
    if (t1) {
        return clvm_1.SExp.to(0);
    }
    return r;
}
exports.quote_null_optimizer = quote_null_optimizer;
exports.APPLY_NULL_PATTERN_1 = binutils_1.assemble("(a 0 . (: . rest))");
function apply_null_optimizer(r, eval_f) {
    // This applies the transform `(a 0 ARGS)` => `0`
    const t1 = pattern_match_1.match(exports.APPLY_NULL_PATTERN_1, r);
    if (t1) {
        return clvm_1.SExp.to(0);
    }
    return r;
}
exports.apply_null_optimizer = apply_null_optimizer;
function optimize_sexp(r, eval_f) {
    /*
      Optimize an s-expression R written for clvm to R_opt where
      (a R args) == (a R_opt args) for ANY args.
     */
    if (r.nullp() || !r.listp()) {
        return r;
    }
    const OPTIMIZERS = [
        cons_optimizer,
        constant_optimizer,
        cons_q_a_optimizer,
        var_change_optimizer_cons_eval,
        children_optimizer,
        path_optimizer,
        quote_null_optimizer,
        apply_null_optimizer,
    ];
    while (r.listp()) {
        const start_r = r;
        let opt = OPTIMIZERS[0];
        for (opt of OPTIMIZERS) {
            r = opt(r, eval_f);
            if (!start_r.equal_to(r)) {
                break;
            }
        }
        if (start_r.equal_to(r)) {
            return r;
        }
        if (DEBUG_OPTIMIZATIONS) {
            print_1.print(`OPT-${opt.name}[${start_r}] => ${r}`);
        }
    }
    return r;
}
exports.optimize_sexp = optimize_sexp;
function make_do_opt(run_program) {
    return function do_opt(args) {
        return clvm_1.t(1, optimize_sexp(args.first(), run_program));
    };
}
exports.make_do_opt = make_do_opt;
