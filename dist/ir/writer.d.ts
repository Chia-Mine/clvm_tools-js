import { SExp, str, Stream } from "clvm";
export declare function iter_sexp_format(ir_sexp: SExp): Generator<str>;
export declare function iter_ir_format(ir_sexp: SExp): Generator<str>;
export declare function write_ir_to_stream(ir_sexp: SExp, f: Stream): void;
export declare function write_ir(ir_sexp: SExp): str;
