import { CastableType, SExp } from "clvm";
export declare const QUOTE_ATOM: string;
export declare const APPLY_ATOM: string;
export declare function quote(sexp: CastableType): import("clvm").Tuple<import("clvm").Bytes, CastableType>;
export declare function evaluate(prog: SExp, args: CastableType): SExp;
export declare function run(prog: SExp, macro_lookup: CastableType): SExp;
export declare function brun(prog: SExp, args: CastableType): SExp;
