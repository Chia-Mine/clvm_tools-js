import { SExp } from "clvm";
import { TRunProgram } from "../stage_0";
export declare const DEFAULT_MACROS_SRC: string[];
export declare function build_default_macro_lookup(eval_f: TRunProgram): SExp | null;
export declare function default_macro_lookup(eval_f: TRunProgram): SExp | null;
