import { CLVMObject, int, None, SExp, TPreEvalF, Tuple } from "clvm";
export declare function make_invocation(code: SExp): (args: CLVMObject) => Tuple<number, CLVMObject>;
export declare function make_bindings(bindings_sexp: SExp): Record<string, (args: CLVMObject) => unknown>;
export declare function do_binding(args: SExp): Tuple<any, any>;
export declare const BINDINGS: {
    bind: typeof do_binding;
};
export declare const run: SExp;
export declare const brun: SExp;
export declare function RunProgram(): {
    (program: SExp, args: CLVMObject, max_cost?: int | None, pre_eval_f?: TPreEvalF | None, strict?: boolean): Tuple<number, CLVMObject>;
    operator_lookup: import("clvm").TOperatorDict<"00" | "01" | "02" | "03" | "04" | "05" | "06" | "07" | "08" | "09" | "0a" | "0b" | "0c" | "0d" | "0e" | "0f" | "10" | "11" | "12" | "13" | "14" | "15" | "16" | "17" | "18" | "19" | "1a" | "1b" | "1c" | "1d" | "1e" | "1f" | "20" | "21" | "22" | "23" | "24">;
};
export declare const run_program: {
    (program: SExp, args: CLVMObject, max_cost?: int | None, pre_eval_f?: TPreEvalF | None, strict?: boolean): Tuple<number, CLVMObject>;
    operator_lookup: import("clvm").TOperatorDict<"00" | "01" | "02" | "03" | "04" | "05" | "06" | "07" | "08" | "09" | "0a" | "0b" | "0c" | "0d" | "0e" | "0f" | "10" | "11" | "12" | "13" | "14" | "15" | "16" | "17" | "18" | "19" | "1a" | "1b" | "1c" | "1d" | "1e" | "1f" | "20" | "21" | "22" | "23" | "24">;
};
