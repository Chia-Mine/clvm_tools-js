import {
  run_program as default_run_program,
  OPERATOR_LOOKUP,
  OperatorDict,
  EvalError,
  None,
  SExp,
  CLVMType,
  TOperatorDict,
  TPreEvalF,
  Bytes,
} from "clvm";
export type RunProgramOption = Partial<{
  operator_lookup: TOperatorDict;
  max_cost: number|None;
  pre_eval_f: TPreEvalF|None;
  strict: boolean;
}>;

export function run_program(
  program: SExp,
  args: CLVMType,
  option?: RunProgramOption,
){
  let operator_lookup = (option && option.operator_lookup) || OPERATOR_LOOKUP;
  const strict = (option && option.strict) || false;
  const max_cost = (option && typeof option.max_cost === "number") ? option.max_cost : None;
  const pre_eval_f = (option && option.pre_eval_f) ? option.pre_eval_f : None;
  
  if(strict){
    const fatal_error = (op: Bytes, args: SExp) => {
      const errMsg = "unimplemented operator";
      // printError(`EvalError: ${errMsg} ${op}`);
      throw new EvalError(errMsg, SExp.to(op));
    }
    operator_lookup = OperatorDict(operator_lookup, {unknown_op_handler: fatal_error});
  }
  
  // clvm's JS `run_program` is deprecated in favor of `run_chia_program`,
  // but the stage-2 compiler and the tracing/debugging code paths need the
  // JavaScript evaluator (pre_eval_f is not supported by clvm_wasm).
  // Suppress the deprecation warning it prints on every call.
  const warn = console.warn;
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  console.warn = () => {};
  try{
    return default_run_program(program, args, operator_lookup, max_cost, pre_eval_f);
  }
  finally{
    console.warn = warn;
  }
}

export type TRunProgram = typeof run_program;
