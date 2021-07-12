"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compile_mod = exports.compile_functions = exports.build_macro_lookup_program = exports.symbol_table_for_tree = exports.compile_mod_stage_1 = exports.parse_mod_sexp = exports.defun_inline_to_macro = exports.unquote_args = exports.parse_include = exports.build_used_constants_names = exports.flatten = exports.build_tree_program = exports.build_tree = exports.MAIN_NAME = exports.CONS_ATOM = exports.QUOTE_ATOM = void 0;
const clvm_1 = require("clvm");
const binutils = require("../../clvm_tools/binutils");
const debug_1 = require("../../clvm_tools/debug");
const NodePath_1 = require("../../clvm_tools/NodePath");
const helpers_1 = require("./helpers");
const optimize_1 = require("./optimize");
exports.QUOTE_ATOM = clvm_1.KEYWORD_TO_ATOM["q"];
exports.CONS_ATOM = clvm_1.KEYWORD_TO_ATOM["c"];
exports.MAIN_NAME = "";
function build_tree(items) {
    // This function takes a Python list of items and turns it into a binary tree
    // of the items, suitable for casting to an s-expression.
    const size = items.length;
    if (size === 0) {
        return [];
    }
    else if (size === 1) {
        return clvm_1.h(items[0]); // items[0] is expected to be a hex string representing constant name atom
    }
    const half_size = size >> 1;
    const left = build_tree(items.slice(0, half_size));
    const right = build_tree(items.slice(half_size));
    return clvm_1.t(left, right);
}
exports.build_tree = build_tree;
function build_tree_program(items) {
    // This function takes a Python list of items and turns it into a program that
    //  a binary tree of the items, suitable for casting to an s-expression.
    const size = items.length;
    if (size === 0) {
        return [helpers_1.quote([])];
    }
    else if (size === 1) {
        return items[0];
    }
    const half_size = size >> 1;
    const left = build_tree_program(items.slice(0, half_size));
    const right = build_tree_program(items.slice(half_size));
    return [clvm_1.h(exports.CONS_ATOM), left, right];
}
exports.build_tree_program = build_tree_program;
function flatten(sexp) {
    // Return a (python) list of every atom.
    if (sexp.listp()) {
        let r = [];
        r = r.concat(flatten(sexp.first()));
        r = r.concat(flatten(sexp.rest()));
        return r;
    }
    return [sexp.atom];
}
exports.flatten = flatten;
/**
 * @return Used constants name array in `hex string` format.
 */
function build_used_constants_names(functions, constants, macros) {
    /*
      Do a naïve pruning of unused symbols. It may be too big, but it shouldn't
      be too small. Return a list of all atoms used that are also the names of
      functions or constants, starting with the MAIN_NAME function.
     */
    const macro_as_dict = macros.reduce((acc, _) => {
        acc[_.rest().first().atom.hex()] = _;
        return acc;
    }, {});
    const possible_symbols = new Set(Object.keys(functions));
    Object.keys(constants).forEach(c => possible_symbols.add(c));
    let new_names = new Set([exports.MAIN_NAME]);
    const used_names = new Set(new_names);
    while (new_names.size) {
        const prior_new_names = new Set(new_names);
        new_names = new Set();
        for (const _ of prior_new_names) {
            for (const k of [functions, macro_as_dict]) {
                if (_ in k) {
                    flatten(k[_]).forEach(atom => new_names.add(atom.hex()));
                }
            }
        }
        // new_names.difference_update(used_names)
        used_names.forEach(n => new_names.delete(n));
        // used_names.update(new_names)
        new_names.forEach(n => used_names.add(n));
    }
    // used_names.intersection_update(possible_symbols)
    const used_name_list = [];
    used_names.forEach(n => {
        if (possible_symbols.has(n) && n !== exports.MAIN_NAME) {
            used_name_list.push(n);
        }
    });
    used_name_list.sort();
    return used_name_list;
}
exports.build_used_constants_names = build_used_constants_names;
function parse_include(name, namespace, functions, constants, macros, run_program) {
    const prog = binutils.assemble("(_read (_full_path_for_name 1))");
    const assembled_sexp = run_program(prog, name)[1];
    for (const sexp of assembled_sexp.as_iter()) {
        parse_mod_sexp(sexp, namespace, functions, constants, macros, run_program);
    }
}
exports.parse_include = parse_include;
function unquote_args(code, args) {
    if (code.listp()) {
        const c1 = code.first();
        const c2 = code.rest();
        return unquote_args(c1, args).cons(unquote_args(c2, args));
    }
    if (clvm_1.isAtom(code) && args.some(arg => arg.equal_to(code.atom))) {
        return clvm_1.SExp.to([clvm_1.b("unquote"), code]);
    }
    return code;
}
exports.unquote_args = unquote_args;
function defun_inline_to_macro(declaration_sexp) {
    const d2 = declaration_sexp.rest();
    const d3 = d2.rest();
    const r = [clvm_1.b("defmacro"), d2.first(), d3.first()];
    const code = d3.rest().first();
    const args = flatten(d3.first()).filter(_ => !_.equal_to(clvm_1.Bytes.NULL));
    const unquoted_code = unquote_args(code, args);
    const r2 = [...r, [clvm_1.b("qq"), unquoted_code]];
    return clvm_1.SExp.to(r2);
}
exports.defun_inline_to_macro = defun_inline_to_macro;
function parse_mod_sexp(declaration_sexp, namespace, functions, constants, macros, run_program) {
    const op = declaration_sexp.first().atom;
    const name = declaration_sexp.rest().first();
    if (op.equal_to(clvm_1.b("include"))) {
        parse_include(name, namespace, functions, constants, macros, run_program);
        return;
    }
    const name_atom = name.atom;
    if (namespace.has(name_atom.hex())) {
        throw new SyntaxError(`symbol "${name_atom.decode()}" redefined`);
    }
    namespace.add(name_atom.hex());
    if (op.equal_to(clvm_1.b("defmacro"))) {
        macros.push(declaration_sexp);
    }
    else if (op.equal_to(clvm_1.b("defun"))) {
        functions[name_atom.hex()] = declaration_sexp.rest().rest();
    }
    else if (op.equal_to(clvm_1.b("defun-inline"))) {
        macros.push(defun_inline_to_macro(declaration_sexp));
    }
    else if (op.equal_to(clvm_1.b("defconstant"))) {
        constants[name_atom.hex()] = clvm_1.SExp.to(helpers_1.quote(declaration_sexp.rest().rest().first()));
    }
    else {
        throw new SyntaxError("expected defun, defmacro, or defconstant");
    }
}
exports.parse_mod_sexp = parse_mod_sexp;
function compile_mod_stage_1(args, run_program) {
    // stage 1: collect up names of globals (functions, constants, macros)
    const functions = {};
    const constants = {};
    const macros = [];
    const main_local_arguments = args.first();
    const namespace = new Set();
    // eslint-disable-next-line no-constant-condition
    while (true) {
        args = args.rest();
        if (args.rest().nullp()) {
            break;
        }
        parse_mod_sexp(args.first(), namespace, functions, constants, macros, run_program);
    }
    const uncompiled_main = args.first();
    functions[exports.MAIN_NAME] = clvm_1.SExp.to([main_local_arguments, uncompiled_main]);
    return [functions, constants, macros];
}
exports.compile_mod_stage_1 = compile_mod_stage_1;
function symbol_table_for_tree(tree, root_node) {
    if (tree.nullp()) {
        return [];
    }
    else if (!tree.listp()) {
        return [[tree, root_node.as_path()]];
    }
    const left = symbol_table_for_tree(tree.first(), root_node.add(NodePath_1.LEFT));
    const right = symbol_table_for_tree(tree.rest(), root_node.add(NodePath_1.RIGHT));
    return left.concat(right);
}
exports.symbol_table_for_tree = symbol_table_for_tree;
function build_macro_lookup_program(macro_lookup, macros, run_program) {
    let macro_lookup_program = clvm_1.SExp.to(helpers_1.quote(macro_lookup));
    for (const macro of macros) {
        macro_lookup_program = helpers_1.evaluate(clvm_1.SExp.to([clvm_1.b("opt"), [clvm_1.b("com"), helpers_1.quote([clvm_1.h(exports.CONS_ATOM), macro, macro_lookup_program]), macro_lookup_program]]), NodePath_1.TOP.as_path());
        macro_lookup_program = optimize_1.optimize_sexp(macro_lookup_program, run_program);
    }
    return macro_lookup_program;
}
exports.build_macro_lookup_program = build_macro_lookup_program;
function compile_functions(functions, macro_lookup_program, constants_symbol_table, args_root_node) {
    const compiled_functions = {};
    for (const [name, lambda_expression] of Object.entries(functions)) {
        const local_symbol_table = symbol_table_for_tree(lambda_expression.first(), args_root_node);
        const all_symbols = local_symbol_table.concat(constants_symbol_table);
        compiled_functions[name] = clvm_1.SExp.to([clvm_1.b("opt"), [clvm_1.b("com"),
                helpers_1.quote(lambda_expression.rest().first()),
                macro_lookup_program,
                helpers_1.quote(all_symbols)]]);
    }
    return compiled_functions;
}
exports.compile_functions = compile_functions;
function compile_mod(args, macro_lookup, symbol_table, run_program) {
    // Deal with the "mod" keyword.
    const [functions, constants, macros] = compile_mod_stage_1(args, run_program);
    // move macros into the macro lookup
    const macro_lookup_program = build_macro_lookup_program(macro_lookup, macros, run_program);
    // get a list of all symbols that are possibly used
    const all_constants_names = build_used_constants_names(functions, constants, macros);
    const has_constants_tree = all_constants_names.length > 0;
    // build defuns table, with function names as keys
    const constants_tree = clvm_1.SExp.to(build_tree(all_constants_names));
    const constants_root_node = NodePath_1.LEFT;
    let args_root_node;
    if (has_constants_tree) {
        args_root_node = NodePath_1.RIGHT;
    }
    else {
        args_root_node = NodePath_1.TOP;
    }
    const constants_symbol_table = symbol_table_for_tree(constants_tree, constants_root_node);
    const compiled_functions = compile_functions(functions, macro_lookup_program, constants_symbol_table, args_root_node);
    const main_path_src = binutils.disassemble(compiled_functions[exports.MAIN_NAME]);
    let main_code;
    if (has_constants_tree) {
        const all_constants_lookup = {};
        Object.entries(compiled_functions).forEach(([k, v]) => {
            if (all_constants_names.includes(k)) {
                all_constants_lookup[k] = v;
            }
        });
        Object.entries(constants).forEach(([k, v]) => {
            all_constants_lookup[k] = v;
        });
        const all_constants_list = all_constants_names.map(_ => all_constants_lookup[_]);
        const all_constants_tree_program = clvm_1.SExp.to(build_tree_program(all_constants_list));
        const all_constants_tree_src = binutils.disassemble(all_constants_tree_program);
        const arg_tree_src = `(c ${all_constants_tree_src} 1)`;
        main_code = `(opt (q . (a ${main_path_src} ${arg_tree_src})))`;
        debug_1.build_symbol_dump(all_constants_lookup, run_program, "main.sym");
    }
    else {
        const arg_tree_src = "1";
        main_code = `(opt (q . (a ${main_path_src} ${arg_tree_src})))`;
    }
    return binutils.assemble(main_code);
}
exports.compile_mod = compile_mod;
