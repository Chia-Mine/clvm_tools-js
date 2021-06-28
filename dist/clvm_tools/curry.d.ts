import { SExp } from "clvm";
export declare const CURRY_OBJ_CODE: SExp;
export declare function curry(program: SExp, args: SExp): import("clvm").Tuple<number, import("clvm").CLVMObject>;
export declare const UNCURRY_PATTERN_FUNCTION: SExp;
export declare const UNCURRY_PATTERN_CORE: SExp;
export declare function uncurry(curried_program: SExp): import("clvm").Tuple<SExp, SExp> | null;
