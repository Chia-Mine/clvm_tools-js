import {b, h, int, None, Optional, SExp, str} from "clvm";
import {sha256tree} from "./sha256tree";
import {disassemble} from "./binutils";
import {TRunProgram} from "../stages/stage_0";
import {TSymbolTable} from "../stages/stage_2/mod";
import {write} from "../__io__";

export type OpCallable = (v1: any, v2: ValStackType) => int;
export type ValStackType = SExp[];
export type OpStackType = OpCallable[];

export const PRELUDE = `<html>
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

export const TRAILER = "</div></body></html>";

export function dump_sexp(s: SExp, disassemble_f: typeof disassemble = disassemble){
  return `<span id="${s.__repr__()}">${disassemble_f(s)}</span>`;
}

// The function below is broken as of 2021/06/22.
/*
export function dump_invocation(
  form: SExp,
  rewrit_form: SExp,
  env: SExp[],
  result: SExp,
  disassemble_f: typeof disassemble = disassemble,
){
  console.log(`<hr><div class="invocation" id="${form}">`);
  console.log(`<span class="form"><a name="id_${form}">${dump_sexp(form, disassemble)}</a></span>`);
  console.log("<ul>")
  if (form != rewrit_form){
    console.log(
      `<li>Rewritten as:<span class="form">`,
      `<a name="id_${rewrit_form}">${dump_sexp(rewrit_form, disassemble)}</a></span></li>`,
    );
  }
  env.forEach((e, i) => {
    console.log(`<li>x${i}: <a href="#id_${e}">${dump_sexp(e, disassemble_f)}</a>`);
  });
  console.log("</ul>");
  console.log(`<span class="form">${dump_sexp(result, disassemble_f)}</span>`);
  if(form.listp() && form.list_len() > 1){
    console.log(`<ul>`);
    // @todo Implement here if original python code is fixed.
  }
  console.log(`</ul>`)
  console.log("</div>")
}

export function trace_to_html(){
    // @todo Implement here if original python code is fixed.
}
*/

export function build_symbol_dump(constants_lookup: Record<str, SExp>, run_program: TRunProgram, path: str){
  const compiled_lookup: Record<str, str> = {};
  const entries = Object.entries(constants_lookup);
  for(const [k, v] of entries){
    const [, v1] = run_program(v, SExp.null());
    compiled_lookup[sha256tree(v1).hex()] = h(k).decode();
  }
  const output = JSON.stringify(compiled_lookup, null, 2);
  write(path, output);
}

export function text_trace(disassemble_f: typeof disassemble, form: SExp, symbol: Optional<str>, env: SExp, result: str){
  if(symbol){
    env = env.rest();
    symbol = disassemble_f(SExp.to(b(symbol)).cons(env));
  }
  else{
    symbol = `${disassemble_f(form)} [${disassemble_f(env)}]`
  }
  console.log(`${symbol} => ${result}`);
}

export function table_trace(disassemble_f: typeof disassemble, form: SExp, symbol: Optional<str>, env: SExp, result: str){
  let sexp;
  let args;
  if(form.listp()){
    sexp = form.first();
    args = form.rest();
  }
  else{
    sexp = form;
    args = SExp.null();
  }
  
  console.log(`exp: ${disassemble_f(sexp)}`);
  console.log(`arg: ${disassemble_f(args)}`);
  console.log(`env: ${disassemble_f(env)}`);
  console.log(`val: ${result}`);
  console.log(`bexp: ${sexp.as_bin()}`);
  console.log(`barg: ${args.as_bin()}`);
  console.log(`benv: ${env.as_bin()}`);
  console.log("--");
}

export function display_trace(
  trace: Array<[SExp, SExp, Optional<SExp>]>,
  disassemble_f: typeof disassemble,
  symbol_table: Optional<Record<str, str>>,
  display_fun: typeof text_trace,
){
  for(const item of trace){
    const [form, env, _rv] = item;
    let rv;
    if(_rv === None){
      rv = "(didn't finish)";
    }
    else{
      rv = disassemble_f(_rv);
    }
    
    const h = sha256tree(form).hex();
    const symbol = symbol_table ? symbol_table[h] : symbol_table;
    display_fun(disassemble_f, form, symbol, env, rv);
  }
}

export function trace_to_text(
  trace: Array<[SExp, SExp, Optional<SExp>]>,
  disassemble_f: typeof disassemble,
  symbol_table: Record<str, str>,
){
  display_trace(trace, disassemble_f, symbol_table, text_trace);
}

export function trace_to_table(
  trace: Array<[SExp, SExp, Optional<SExp>]>,
  disassemble_f: typeof disassemble,
  symbol_table: Optional<Record<str, str>>,
){
  display_trace(trace, disassemble_f, symbol_table, table_trace);
}

export function make_trace_pre_eval(
  log_entries: Array<[SExp, SExp, Optional<SExp>]>,
  symbol_table: Optional<TSymbolTable> = None,
){
  return function pre_eval_f(sexp: SExp, args: SExp){
    const [_sexp, _args] = [sexp, args].map(_ => SExp.to(_));
    if(symbol_table){
      const h = sha256tree(sexp).hex();
      if(!(h in symbol_table)){
        return None;
      }
    }
    const log_entry: [SExp, SExp, Optional<SExp>] = [_sexp, _args, None];
    log_entries.push(log_entry);
    
    return function callback_f(r: SExp){
      log_entry[log_entry.length-1] = SExp.to(r);
    };
  };
}