import {b, Bytes, CLVMType, OPERATOR_LOOKUP, OperatorDict, SExp, t, Tuple} from "clvm";
import {run_program as run_program_0, RunProgramOption} from "./stage_0";
import * as binutils from "../clvm_tools/binutils";
import {printError} from "../platform/print";


export function make_invocation(code: SExp){
  return function invoke(args: CLVMType){
    return run_program(code, args);
  };
}

export function make_bindings(bindings_sexp: SExp){
  const binding_table: Record<string, (args: CLVMType)=>unknown> = {};
  for(const pair of bindings_sexp.as_iter()){
    const name = pair.first().atom as Bytes;
    binding_table[name.hex()] = make_invocation(pair.rest().first());
  }
  return binding_table;
}

export function do_binding(args: SExp){
  if(args.as_javascript().length !== 3){
    const errMsg = "bind requires 3 arguments";
    printError(`SyntaxError: ${errMsg}`);
    throw new SyntaxError(errMsg);
  }
  const bindings = args.first();
  const sexp = args.rest().first();
  const env = args.rest().rest().first();
  const new_bindings = make_bindings(bindings);
  const original_operator_lookup = run_program.operator_lookup;
  run_program.operator_lookup = OperatorDict(original_operator_lookup);
  merge(run_program.operator_lookup as Record<string, unknown>, new_bindings);
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
  const operator_lookup = OperatorDict(OPERATOR_LOOKUP);
  const bindings_obj: Record<string, (v: SExp) => Tuple<number, SExp>> = {};
  Object.entries(BINDINGS).forEach(([key, val]) => {
    const bin_name = b(key).hex(); // bind: 61696e64
    bindings_obj[bin_name] = val;
  });
  merge(operator_lookup as any, bindings_obj);
  
  const f = function(
    program: SExp,
    args: CLVMType,
    option?: Omit<RunProgramOption, "operator_lookup">,
  ){
    const option2 = option ? {...option, operator_lookup: f.operator_lookup} : {operator_lookup: f.operator_lookup};
    return run_program_0(program, args, option2);
  };
  
  f.operator_lookup = operator_lookup;
  
  return f;
}

export const run_program = RunProgram();
