import { SExp, str, Tuple, Bytes, int } from "clvm";
import { Stream } from "clvm/dist/__type_compatibility__";
import * as stage_0 from "../stages/stage_0";
import * as stage_1 from "../stages/stage_1";
import * as stage_2 from "../stages/stage_2";
import { TRunProgram } from "../stages/stage_0";
export declare function path_or_code(arg: string): any;
export declare function stream_to_bin(write_f: (f: Stream) => void): Bytes;
export declare type TConversion = (text: str) => Tuple<SExp, str>;
export declare function call_tool(tool_name: str, desc: str, conversion: TConversion, input_args: str[]): void;
export declare function opc(args: string[]): void;
export declare function opd(args: string[]): void;
export declare function stage_import(stage: str): typeof stage_2 | typeof stage_0 | typeof stage_1;
export declare function as_bin(streamer_f: (s: Stream) => unknown): Bytes;
export declare function run(args: str[]): -1 | undefined;
export declare function brun(args: str[]): -1 | undefined;
export declare function calculate_cost_offset(run_program: TRunProgram, run_script: SExp): number;
export declare function launch_tool(args: str[], tool_name: "run" | "brun", default_stage?: int): -1 | undefined;
export declare function read_ir(args: str[]): void;
