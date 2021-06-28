import { SExp, str } from "clvm";
export declare function compile_clvm_text(text: str, search_paths: str[]): SExp;
export declare function compile_clvm(input_path: str, output_path: str, search_paths?: str[]): string;
export declare function find_files(path?: str): string[];
