import {
  run_program as default_run_program,
  OPERATOR_LOOKUP,
  OperatorDict,
  EvalError,
  None,
  SExp,
  CLVMObject,
  TOperatorDict,
  int,
  TPreEvalF,
  Bytes,
} from "clvm";
import * as binutils from "../clvm_tools/binutils";

export const run = binutils.assemble("(a 2 3)");
export const brun = run;

export function run_program(
  program: SExp,
  args: CLVMObject,
  operator_lookup: TOperatorDict = OPERATOR_LOOKUP,
  max_cost: int|None=None,
  pre_eval_f: TPreEvalF|None = None,
  strict: boolean = false,
){
  if(strict){
    const fatal_error = (op: Bytes, args: SExp) => {
      throw new EvalError("unimplemented operator", SExp.to(op));
    }
    operator_lookup = OperatorDict(operator_lookup as any, undefined, undefined, fatal_error);
  }
  
  return default_run_program(program, args, operator_lookup, max_cost, pre_eval_f);
}

export type TRunProgram = typeof run_program;
