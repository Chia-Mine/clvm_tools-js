import { Bytes, None, SExp, str } from "clvm";
export declare const ATOM_MATCH: Bytes;
export declare const SEXP_MATCH: Bytes;
export declare function unify_bindings(bindings: Record<str, SExp>, new_key: Bytes, new_value: SExp): Record<string, SExp> | null;
export declare function match(pattern: SExp, sexp: SExp, known_bindings?: Record<str, SExp>): Record<str, SExp> | None;
