import {b, Bytes, CLVMObject, int, None, OPERATOR_LOOKUP, OperatorDict, SExp, str, TPreEvalF, t, Tuple} from "clvm";
import {run_program as run_program_0} from "./stage_0";
import * as binutils from "../clvm_tools/binutils";


export function make_invocation(code: SExp){
  return function invoke(args: CLVMObject){
    return run_program(code, args);
  };
}

export function make_bindings(bindings_sexp: SExp){
  const binding_table: Record<str, (args: CLVMObject)=>unknown> = {};
  for(const pair of bindings_sexp.as_iter()){
    const name = pair.first().atom as Bytes;
    binding_table[name.hex()] = make_invocation(pair.rest().first());
  }
  return binding_table;
}

export function do_binding(args: SExp){
  if(args.as_javascript().length !== 3){
    throw new SyntaxError("bind requires 3 arguments");
  }
  const bindings = args.first();
  const sexp = args.rest().first();
  const env = args.rest().rest().first();
  const new_bindings = make_bindings(bindings);
  const original_operator_lookup = run_program.operator_lookup;
  run_program.operator_lookup = OperatorDict(original_operator_lookup as any);
  merge(run_program.operator_lookup as Record<str, unknown>, new_bindings);
  const [cost, r] = run_program(sexp, env);
  run_program.operator_lookup = original_operator_lookup;
  return t(cost, r);
}

export const BINDINGS = {
  bind: do_binding,
};

export const run = binutils.assemble("(a 2 3)");
export const brun = run;


function merge(obj1: Record<string, unknown>, obj2: Record<string, unknown>){
  Object.keys(obj2).forEach(key => {
    obj1[key] = obj2[key];
  });
}

export function RunProgram(){
  const operator_lookup = OperatorDict(OPERATOR_LOOKUP as any);
  const bindings_obj: Record<str, (v: SExp) => Tuple<int, SExp>> = {};
  Object.entries(BINDINGS).forEach(([key, val]) => {
    const bin_name = b(key).hex(); // bind: 61696e64
    bindings_obj[bin_name] = val;
  });
  merge(operator_lookup as any, bindings_obj);
  
  const f = function(
    program: SExp,
    args: CLVMObject,
    max_cost: int|None = None,
    pre_eval_f: TPreEvalF|None = None,
    strict: boolean = false,
  ){
    return run_program_0(program, args, operator_lookup, max_cost, pre_eval_f, strict);
  };
  
  f.operator_lookup = operator_lookup;
  
  return f;
}

export const run_program = RunProgram();
