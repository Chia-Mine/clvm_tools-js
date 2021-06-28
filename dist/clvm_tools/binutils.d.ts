import { SExp, str, Bytes, int, Tuple } from "clvm";
export declare function assemble_from_ir(ir_sexp: SExp): SExp;
export declare function type_for_atom(atom: Bytes): int;
export declare function disassemble_to_ir<A extends boolean = false>(sexp: SExp, keyword_from_atom: Record<str, str>, allow_keyword?: A): A extends false | undefined ? SExp : SExp | Tuple<int, Bytes>;
export declare function disassemble(sexp: SExp, keyword_from_atom?: Record<str, str>): string;
export declare function assemble(s: str): SExp;
