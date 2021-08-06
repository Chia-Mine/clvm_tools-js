import { Bytes, SExp, str, Tuple } from "clvm";
import { NodePath } from "../../clvm_tools/NodePath";
import { TRunProgram } from "../stage_0";
export declare const QUOTE_ATOM: string;
export declare const CONS_ATOM: string;
export declare const MAIN_NAME = "";
export declare type TBuildTree = Bytes | Tuple<TBuildTree, TBuildTree> | [];
export declare function build_tree(items: str[]): TBuildTree;
export declare type TBuildTreeProgram = SExp | [Bytes, TBuildTree, TBuildTree] | [Tuple<Bytes, SExp>];
export declare function build_tree_program(items: SExp[]): TBuildTreeProgram;
export declare function flatten(sexp: SExp): Bytes[];
export declare type TNameToSExp = Record<str, SExp>;
/**
 * @return Used constants name array in `hex string` format.
 */
export declare function build_used_constants_names(functions: TNameToSExp, constants: TNameToSExp, macros: SExp[]): string[];
export declare function parse_include(name: SExp, namespace: Set<str>, functions: TNameToSExp, constants: TNameToSExp, macros: SExp[], run_program: TRunProgram): void;
export declare function unquote_args(code: SExp, args: Bytes[]): SExp;
export declare function defun_inline_to_macro(declaration_sexp: SExp): SExp;
export declare function parse_mod_sexp(declaration_sexp: SExp, namespace: Set<str>, functions: TNameToSExp, constants: TNameToSExp, macros: SExp[], run_program: TRunProgram): void;
export declare function compile_mod_stage_1(args: SExp, run_program: TRunProgram): [TNameToSExp, TNameToSExp, SExp[]];
export declare type TSymbolTable = Array<[SExp, Bytes]>;
export declare function symbol_table_for_tree(tree: SExp, root_node: NodePath): TSymbolTable;
export declare function build_macro_lookup_program(macro_lookup: SExp, macros: SExp[], run_program: TRunProgram): SExp;
export declare function compile_functions(functions: TNameToSExp, macro_lookup_program: SExp, constants_symbol_table: Array<[SExp, Bytes]>, args_root_node: NodePath): Record<string, SExp>;
export declare function compile_mod(args: SExp, macro_lookup: SExp, symbol_table: SExp, run_program: TRunProgram): SExp;