import { CLVMObject, int, None, SExp, str, TOperatorDict, TPreEvalF } from "clvm";
export declare function do_read(args: SExp): import("clvm").Tuple<number, SExp>;
export declare function do_write(args: SExp): import("clvm").Tuple<number, SExp>;
export declare function run_program_for_search_paths(search_paths: str[]): (program: SExp, args: CLVMObject, operator_lookup?: TOperatorDict | None, max_cost?: int | None, pre_eval_f?: TPreEvalF | None, strict?: boolean) => import("clvm").Tuple<number, CLVMObject>;
