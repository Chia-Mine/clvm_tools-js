import { CLVMObject, SExp, str } from "clvm";
export declare function do_read(args: SExp): import("clvm").Tuple<number, SExp>;
export declare function do_write(args: SExp): import("clvm").Tuple<number, SExp>;
export declare function run_program_for_search_paths(search_paths: str[]): (program: SExp, args: CLVMObject, option?: Partial<{
    operator_lookup: import("clvm").TOperatorDict<"00" | "01" | "02" | "03" | "04" | "05" | "06" | "07" | "08" | "09" | "0a" | "0b" | "0c" | "0d" | "0e" | "0f" | "10" | "11" | "12" | "13" | "14" | "15" | "16" | "17" | "18" | "19" | "1a" | "1b" | "1c" | "1d" | "1e" | "1f" | "20" | "21" | "22" | "23" | "24">;
    max_cost: number | null;
    pre_eval_f: import("clvm").TPreEvalF | null;
    strict: boolean;
}> | undefined) => import("clvm").Tuple<number, CLVMObject>;
