"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.make_trace_pre_eval = exports.trace_to_table = exports.trace_to_text = exports.display_trace = exports.table_trace = exports.text_trace = exports.build_symbol_dump = exports.dump_sexp = exports.TRAILER = exports.PRELUDE = void 0;
const clvm_1 = require("clvm");
const sha256tree_1 = require("./sha256tree");
const binutils_1 = require("./binutils");
const io_1 = require("../platform/io");
const print_1 = require("../platform/print");
exports.PRELUDE = `<html>
<head>
  <link rel="stylesheet"
      href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css"
      integrity="sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T"
      crossorigin="anonymous">
  <script
      src="https://code.jquery.com/jquery-3.3.1.slim.min.js"
      integrity="sha384-q8i/X+965DzO0rT7abK41JStQIAqVgRVzpbzo5smXKp4YfRvH+8abtTE1Pi6jizo"
      crossorigin="anonymous"></script>
  <script
      src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.7/umd/popper.min.js"
      integrity="sha384-UO2eT0CpHqdSJQ6hJty5KVphtPhzWj9WO1clHTMGa3JDZwrnQq4sF86dIHNDz0W1"
      crossorigin="anonymous"></script>
  <script
      src="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/js/bootstrap.min.js"
      integrity="sha384-JjSmVgyd0p3pXB1rRibZUAYoIIy6OrQ6VrjIEaFf/nJGzIxFDsf4x0xIM+B07jRM"
      crossorigin="anonymous"></script>
</head>
<body>
<div class="container">
`;
exports.TRAILER = "</div></body></html>";
function dump_sexp(s, disassemble_f = binutils_1.disassemble) {
    return `<span id="${s.__repr__()}">${disassemble_f(s)}</span>`;
}
exports.dump_sexp = dump_sexp;
// The function below is broken as of 2021/06/22.
/*
export function dump_invocation(
  form: SExp,
  rewrit_form: SExp,
  env: SExp[],
  result: SExp,
  disassemble_f: typeof disassemble = disassemble,
){
  print(`<hr><div class="invocation" id="${form}">`);
  print(`<span class="form"><a name="id_${form}">${dump_sexp(form, disassemble)}</a></span>`);
  print("<ul>")
  if (form != rewrit_form){
    print(
      `<li>Rewritten as:<span class="form">`,
      `<a name="id_${rewrit_form}">${dump_sexp(rewrit_form, disassemble)}</a></span></li>`,
    );
  }
  env.forEach((e, i) => {
    print(`<li>x${i}: <a href="#id_${e}">${dump_sexp(e, disassemble_f)}</a>`);
  });
  print("</ul>");
  print(`<span class="form">${dump_sexp(result, disassemble_f)}</span>`);
  if(form.listp() && form.list_len() > 1){
    print(`<ul>`);
    // @todo Implement here if original python code is fixed.
  }
  print(`</ul>`)
  print("</div>")
}

export function trace_to_html(){
    // @todo Implement here if original python code is fixed.
}
*/
function build_symbol_dump(constants_lookup, run_program, path) {
    const compiled_lookup = {};
    const entries = Object.entries(constants_lookup);
    for (const [k, v] of entries) {
        const [, v1] = run_program(v, clvm_1.SExp.null());
        compiled_lookup[sha256tree_1.sha256tree(v1).hex()] = clvm_1.h(k).decode();
    }
    const output = JSON.stringify(compiled_lookup);
    io_1.fs_write(path, output);
}
exports.build_symbol_dump = build_symbol_dump;
function text_trace(disassemble_f, form, symbol, env, result) {
    if (symbol) {
        env = env.rest();
        symbol = disassemble_f(clvm_1.SExp.to(clvm_1.b(symbol)).cons(env));
    }
    else {
        symbol = `${disassemble_f(form)} [${disassemble_f(env)}]`;
    }
    print_1.print(`${symbol} => ${result}`);
    print_1.print("");
}
exports.text_trace = text_trace;
function table_trace(disassemble_f, form, symbol, env, result) {
    let sexp;
    let args;
    if (form.listp()) {
        sexp = form.first();
        args = form.rest();
    }
    else {
        sexp = form;
        args = clvm_1.SExp.null();
    }
    print_1.print(`exp: ${disassemble_f(sexp)}`);
    print_1.print(`arg: ${disassemble_f(args)}`);
    print_1.print(`env: ${disassemble_f(env)}`);
    print_1.print(`val: ${result}`);
    print_1.print(`bexp: ${sexp.as_bin()}`);
    print_1.print(`barg: ${args.as_bin()}`);
    print_1.print(`benv: ${env.as_bin()}`);
    print_1.print("--");
}
exports.table_trace = table_trace;
function display_trace(trace, disassemble_f, symbol_table, display_fun) {
    for (const item of trace) {
        const [form, env, _rv] = item;
        let rv;
        if (_rv === clvm_1.None) {
            rv = "(didn't finish)";
        }
        else {
            rv = disassemble_f(_rv);
        }
        const h = sha256tree_1.sha256tree(form).hex();
        const symbol = symbol_table ? symbol_table[h] : symbol_table;
        display_fun(disassemble_f, form, symbol, env, rv);
    }
}
exports.display_trace = display_trace;
function trace_to_text(trace, disassemble_f, symbol_table) {
    display_trace(trace, disassemble_f, symbol_table, text_trace);
}
exports.trace_to_text = trace_to_text;
function trace_to_table(trace, disassemble_f, symbol_table) {
    display_trace(trace, disassemble_f, symbol_table, table_trace);
}
exports.trace_to_table = trace_to_table;
function make_trace_pre_eval(log_entries, symbol_table = clvm_1.None) {
    return function pre_eval_f(sexp, args) {
        const [_sexp, _args] = [sexp, args].map(_ => clvm_1.SExp.to(_));
        if (symbol_table) {
            const h = sha256tree_1.sha256tree(_sexp).hex();
            if (!(h in symbol_table)) {
                return clvm_1.None;
            }
        }
        const log_entry = [_sexp, _args, clvm_1.None];
        log_entries.push(log_entry);
        return function callback_f(r) {
            log_entry[log_entry.length - 1] = clvm_1.SExp.to(r);
        };
    };
}
exports.make_trace_pre_eval = make_trace_pre_eval;
