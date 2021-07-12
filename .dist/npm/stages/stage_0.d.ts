import { None, SExp, CLVMObject, TOperatorDict, int, TPreEvalF } from "clvm";
export declare const run: SExp;
export declare const brun: SExp;
export declare type RunProgramOption = Partial<{
    operator_lookup: TOperatorDict;
    max_cost: int | None;
    pre_eval_f: TPreEvalF | None;
    strict: boolean;
}>;
export declare function run_program(program: SExp, args: CLVMObject, option?: RunProgramOption): import("clvm").Tuple<number, CLVMObject>;
export declare type TRunProgram = typeof run_program;
