import { SExp, int, None } from "clvm";
import { TRunProgram } from "../stage_0";
export declare const QUOTE_ATOM: string;
export declare const APPLY_ATOM: string;
export declare const CONS_ATOM: string;
export declare const PASS_THROUGH_OPERATORS: Set<string>;
export declare function compile_qq(args: SExp, macro_lookup: SExp, symbol_table: SExp, run_program: TRunProgram, level?: int): SExp;
export declare function compile_macros(args: SExp, macro_lookup: SExp, symbol_table: SExp, run_program: TRunProgram): SExp;
export declare function compile_symbols(args: SExp, macro_lookup: SExp, symbol_table: SExp, run_program: TRunProgram): SExp;
export declare const COMPILE_BINDINGS: {
    [x: string]: typeof compile_qq;
};
export declare function lower_quote(prog: SExp, macro_lookup?: SExp | None, symbol_table?: SExp | None, run_program?: TRunProgram | None): SExp;
export declare function do_com_prog(prog: SExp, macro_lookup: SExp, symbol_table: SExp, run_program: TRunProgram): SExp;
export declare function make_do_com(run_program: TRunProgram): (sexp: SExp) => import("clvm").Tuple<number, SExp>;
