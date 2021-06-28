"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.make_do_com = exports.do_com_prog = exports.lower_quote = exports.COMPILE_BINDINGS = exports.compile_symbols = exports.compile_macros = exports.compile_qq = exports.PASS_THROUGH_OPERATORS = exports.CONS_ATOM = exports.APPLY_ATOM = exports.QUOTE_ATOM = void 0;
const clvm_1 = require("clvm");
const binutils_1 = require("../../clvm_tools/binutils");
const NodePath_1 = require("../../clvm_tools/NodePath");
const defaults_1 = require("./defaults");
const helpers_1 = require("./helpers");
const mod_1 = require("./mod");
exports.QUOTE_ATOM = clvm_1.KEYWORD_TO_ATOM["q"];
exports.APPLY_ATOM = clvm_1.KEYWORD_TO_ATOM["a"];
exports.CONS_ATOM = clvm_1.KEYWORD_TO_ATOM["c"];
exports.PASS_THROUGH_OPERATORS = new Set(Object.values(clvm_1.KEYWORD_TO_ATOM));
for (const _ of ["com", "opt"]) {
    exports.PASS_THROUGH_OPERATORS.add(clvm_1.b(_).hex());
}
function compile_qq(args, macro_lookup, symbol_table, run_program, level = 1) {
    /*
    (qq ATOM) => (q . ATOM)
    (qq (unquote X)) => X
    (qq (a . B)) => (c (qq a) (qq B))
     */
    const com = function com(sexp) {
        return do_com_prog(sexp, macro_lookup, symbol_table, run_program);
    };
    const sexp = args.first();
    if (!sexp.listp() || sexp.nullp()) {
        // (qq ATOM) => (q . ATOM)
        return clvm_1.SExp.to(helpers_1.quote(sexp));
    }
    if (sexp.listp() && !sexp.first().listp()) {
        const op = sexp.first().atom;
        if (op.equal_to(clvm_1.b("qq"))) {
            const subexp = compile_qq(sexp.rest(), macro_lookup, symbol_table, run_program, level + 1);
            return com(clvm_1.SExp.to([clvm_1.h(exports.CONS_ATOM), op, [clvm_1.h(exports.CONS_ATOM), subexp, helpers_1.quote(0)]]));
        }
        else if (op.equal_to(clvm_1.b("unquote"))) {
            if (level === 1) {
                // (qq (unquote X)) => X
                return com(sexp.rest().first());
            }
            const subexp = compile_qq(sexp.rest(), macro_lookup, symbol_table, run_program, level - 1);
            return com(clvm_1.SExp.to([clvm_1.h(exports.CONS_ATOM), op, [clvm_1.h(exports.CONS_ATOM), subexp, helpers_1.quote(0)]]));
        }
    }
    // (qq (a . B)) => (c (qq a) (qq B))
    const A = com(clvm_1.SExp.to([clvm_1.b("qq"), sexp.first()]));
    const B = com(clvm_1.SExp.to([clvm_1.b("qq"), sexp.rest()]));
    return clvm_1.SExp.to([clvm_1.h(exports.CONS_ATOM), A, B]);
}
exports.compile_qq = compile_qq;
function compile_macros(args, macro_lookup, symbol_table, run_program) {
    return clvm_1.SExp.to(helpers_1.quote(macro_lookup));
}
exports.compile_macros = compile_macros;
function compile_symbols(args, macro_lookup, symbol_table, run_program) {
    return clvm_1.SExp.to(helpers_1.quote(symbol_table));
}
exports.compile_symbols = compile_symbols;
exports.COMPILE_BINDINGS = {
    [clvm_1.b("qq").hex()]: compile_qq,
    [clvm_1.b("macros").hex()]: compile_macros,
    [clvm_1.b("symbols").hex()]: compile_symbols,
    [clvm_1.b("lambda").hex()]: mod_1.compile_mod,
    [clvm_1.b("mod").hex()]: mod_1.compile_mod,
};
// # Transform "quote" to "q" everywhere. Note that quote will not be compiled if behind qq.
// # Overrides symbol table defns.
function lower_quote(prog, macro_lookup = clvm_1.None, symbol_table = clvm_1.None, run_program = clvm_1.None) {
    if (prog.nullp()) {
        return prog;
    }
    if (prog.listp()) {
        if (clvm_1.b("quote").equal_to(prog.first().atom)) {
            // Note: quote should have exactly one arg, so the length of
            // quoted list should be 2: "(quote arg)"
            if (!prog.rest().rest().nullp()) {
                throw new SyntaxError(`Compilation error while compiling [${binutils_1.disassemble(prog)}]. quote takes exactly one argument.`);
            }
            return clvm_1.SExp.to(helpers_1.quote(lower_quote(prog.rest().first())));
        }
        else {
            return clvm_1.SExp.to(clvm_1.t(lower_quote(prog.first()), lower_quote(prog.rest())));
        }
    }
    else {
        return prog;
    }
}
exports.lower_quote = lower_quote;
function do_com_prog(prog, macro_lookup, symbol_table, run_program) {
    /*
      Turn the given program `prog` into a clvm program using
      the macros to do transformation.
  
      prog is an uncompiled s-expression.
  
      Return a new expanded s-expression PROG_EXP that is equivalent by rewriting
      based upon the operator, where "equivalent" means
  
      (a (com (q PROG) (MACROS)) ARGS) == (a (q PROG_EXP) ARGS)
      for all ARGS.
  
      Also, (opt (com (q PROG) (MACROS))) == (opt (com (q PROG_EXP) (MACROS)))
     */
    // lower "quote" to "q"
    prog = lower_quote(prog, macro_lookup, symbol_table, run_program);
    // quote atoms
    if (prog.nullp() || !prog.listp()) {
        const atom = prog.atom;
        if (clvm_1.b("@").equal_to(atom)) {
            return clvm_1.SExp.to(NodePath_1.TOP.as_path());
        }
        for (const pair of symbol_table.as_iter()) {
            const [symbol, value] = [pair.first(), pair.rest().first()];
            if (symbol.equal_to(atom)) {
                return clvm_1.SExp.to(value);
            }
        }
        return clvm_1.SExp.to(helpers_1.quote(prog));
    }
    const operator = prog.first();
    if (operator.listp()) {
        // (com ((OP) . RIGHT)) => (a (com (q OP)) 1)
        const inner_exp = helpers_1.evaluate(clvm_1.SExp.to([clvm_1.b("com"),
            helpers_1.quote(operator), helpers_1.quote(macro_lookup), helpers_1.quote(symbol_table)]), NodePath_1.TOP.as_path());
        return clvm_1.SExp.to([inner_exp]);
    }
    const atom = operator.atom;
    for (const macro_pair of macro_lookup.as_iter()) {
        const macro_name = macro_pair.first().atom;
        if (atom.equal_to(macro_name)) {
            const macro_code = macro_pair.rest().first();
            const post_prog = helpers_1.brun(macro_code, prog.rest());
            return helpers_1.evaluate(clvm_1.SExp.to([clvm_1.b("com"), post_prog, helpers_1.quote(macro_lookup), helpers_1.quote(symbol_table)]), NodePath_1.TOP.as_short_path());
        }
    }
    if (atom.hex() in exports.COMPILE_BINDINGS) {
        const f = exports.COMPILE_BINDINGS[atom.hex()];
        const post_prog = f(prog.rest(), macro_lookup, symbol_table, run_program);
        return helpers_1.evaluate(clvm_1.SExp.to(helpers_1.quote(post_prog)), NodePath_1.TOP.as_path());
    }
    if (operator.equal_to(clvm_1.h(exports.QUOTE_ATOM))) {
        return prog;
    }
    const compiled_args = [];
    for (const _ of prog.rest().as_iter()) {
        compiled_args.push(do_com_prog(_, macro_lookup, symbol_table, run_program));
    }
    let r = clvm_1.SExp.to([operator].concat(compiled_args));
    if (exports.PASS_THROUGH_OPERATORS.has(atom.hex()) || atom.startswith(clvm_1.b("_"))) {
        return r;
    }
    for (const [symbol, value] of symbol_table.as_javascript()) {
        if (clvm_1.b("*").equal_to(symbol)) {
            return r;
        }
        if (atom.equal_to(symbol)) {
            const list = [];
            for (const _ of prog.rest().as_iter()) {
                list.push(_);
            }
            const new_args = helpers_1.evaluate(clvm_1.SExp.to([clvm_1.b("opt"), [clvm_1.b("com"),
                    helpers_1.quote([clvm_1.b("list")].concat(list)),
                    helpers_1.quote(macro_lookup),
                    helpers_1.quote(symbol_table)]]), NodePath_1.TOP.as_path());
            r = clvm_1.SExp.to([clvm_1.h(exports.APPLY_ATOM), value, [clvm_1.h(exports.CONS_ATOM), NodePath_1.LEFT.as_path(), new_args]]);
            return r;
        }
    }
    throw new SyntaxError(`can't compile ${binutils_1.disassemble(prog)}, unknown operator`);
}
exports.do_com_prog = do_com_prog;
function make_do_com(run_program) {
    return function do_com(sexp) {
        const prog = sexp.first();
        let symbol_table = clvm_1.SExp.null();
        let macro_lookup;
        if (!sexp.rest().nullp()) {
            macro_lookup = sexp.rest().first();
            if (!sexp.rest().rest().nullp()) {
                symbol_table = sexp.rest().rest().first();
            }
        }
        else {
            macro_lookup = defaults_1.default_macro_lookup(run_program);
        }
        return clvm_1.t(1, do_com_prog(prog, macro_lookup, symbol_table, run_program));
    };
}
exports.make_do_com = make_do_com;
