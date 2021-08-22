import {
  to_sexp_f,
  KEYWORD_FROM_ATOM,
  SExp,
  EvalError,
  sexp_from_stream,
  sexp_to_stream,
  Tuple,
  None,
  t,
  Bytes,
  h,
  TPreEvalF,
  Optional,
  CLVMType,
} from "clvm";
import {run_clvm as run_program_rust} from "../platform/clvm_rs";
import * as reader from "../ir/reader";
import * as binutils from "./binutils";
import {make_trace_pre_eval, trace_to_text, trace_to_table} from "./debug";
import {sha256tree} from "./sha256tree";
import {fs_exists, fs_isFile, fs_read, path_join} from "../platform/io";
import {Stream} from "clvm/__type_compatibility__";
import * as argparse from "../platform/argparse";
import * as stage_0 from "../stages/stage_0";
import * as stage_1 from "../stages/stage_1";
import * as stage_2 from "../stages/stage_2/index";
import {TRunProgram} from "../stages/stage_0";
import {now} from "../platform/performance";
import {print} from "../platform/print";

export function path_or_code(arg: string){
  try{
    if(!fs_exists(arg) || !fs_isFile(arg)){
      return arg;
    }
    return fs_read(arg);
  }
  catch(e){
    return arg;
  }
}

export function stream_to_bin(write_f: (f: Stream) => void){
  const f = new Stream();
  write_f(f);
  return f.getValue();
}

export type TConversion = (text: string) => Tuple<SExp, string>;
export function call_tool(tool_name: string, desc: string, conversion: TConversion, input_args: string[]){
  const parser = new argparse.ArgumentParser({description: desc});
  parser.add_argument(
    ["-H", "--script-hash"], {action: "store_true", help: "Show only sha256 tree hash of program"},
  );
  parser.add_argument(
    ["path_or_code"],
    {nargs: "*", type: path_or_code, help: "path to clvm script, or literal script"},
  );
  
  const args = parser.parse_args(input_args.slice(1));
  
  for(const program of (args["path_or_code"] as string[])){
    if(program === "-"){
      throw new Error("Read stdin is not supported at this time");
    }
    const [sexp, text] = conversion(program);
    if(args["script_hash"]){
      print(sha256tree(sexp).hex());
    }
    else if(text){
      print(text);
    }
  }
}

export function opc(args: string[]){
  function conversion(text: string){
    try{
      const ir_sexp = reader.read_ir(text);
      const sexp = binutils.assemble_from_ir(ir_sexp);
      return t(sexp, sexp.as_bin().hex());
    }
    catch(ex){
      print(`${ex instanceof Error ? ex.message : JSON.stringify(ex)}`);
      return t(None, None);
    }
  }
  call_tool("opc", "Compile a clvm script.", conversion, args);
}

export function opd(args: string[]){
  function conversion(hexText: string){
    const sexp = sexp_from_stream(new Stream(Bytes.from(hexText, "hex")), to_sexp_f);
    return t(sexp, binutils.disassemble(sexp));
  }
  call_tool("opd", "Disassemble a compiled clvm script from hex.", conversion, args);
}

export function stage_import(stage: string){
  if(stage === "0"){
    return stage_0;
  }
  else if(stage === "1"){
    return stage_1;
  }
  else if(stage === "2"){
    return stage_2;
  }
  throw new Error(`Unknown stage: ${stage}`);
}

export function as_bin(streamer_f: (s: Stream) => unknown){
  const f = new Stream();
  streamer_f(f);
  return f.getValue();
}

export function run(args: string[]){
  return launch_tool(args, "run", 2);
}

export function brun(args: string[]){
  return launch_tool(args, "brun");
}

export function calculate_cost_offset(run_program: TRunProgram, run_script: SExp){
  /*
    These commands are used by the test suite, and many of them expect certain costs.
    If boilerplate invocation code changes by a fixed cost, you can tweak this
    value so you don't have to change all the tests' expected costs.

    Eventually you should re-tare this to zero and alter the tests' costs though.

    This is a hack and need to go away, probably when we do dialects for real,
    and then the dialect can have a `run_program` API.
   */
  const _null = binutils.assemble("0");
  const result = run_program(run_script, _null.cons(_null));
  const cost = result[0] as number;
  return 53 - cost;
}

export function launch_tool(args: string[], tool_name: "run"|"brun", default_stage: number = 0){
  const parser = new argparse.ArgumentParser({
    prog: ["clvm_tools", tool_name].join(" "),
    description: "Execute a clvm script.",
  });
  parser.add_argument(
    ["--strict"], {action: "store_true",
                   help: "Unknown opcodes are always fatal errors in strict mode"},
  );
  parser.add_argument(
    ["-x", "--hex"], {action: "store_true",
                      help: "Read program and environment as hexadecimal bytecode"},
  );
  parser.add_argument(
    ["-s", "--stage"], {type: stage_import,
                        help: "stage number to include", default: stage_import(default_stage.toString())},
  );
  parser.add_argument(
    ["-v", "--verbose"], {action: "store_true",
                          help: "Display resolve of all reductions, for debugging"},
  );
  parser.add_argument(
    ["-t", "--table"], {action: "store_true",
                        help: "Print diagnostic table of reductions, for debugging"},
  );
  parser.add_argument(
    ["-c", "--cost"], {action: "store_true", help: "Show cost"},
  );
  parser.add_argument(
    ["--time"], {action: "store_true", help: "Print execution time"},
  );
  parser.add_argument(
    ["-m", "--max-cost"], {type: "int", default: 11000000000, help: "Maximum cost"},
  );
  parser.add_argument(
    ["-d", "--dump"], {action: "store_true",
                       help: "dump hex version of final output"},
  );
  parser.add_argument(
    ["--quiet"], {action: "store_true", help: "Suppress printing the program result"},
  );
  parser.add_argument(
    ["-y", "--symbol-table"], {type: path_join,
                               help: ".SYM file generated by compiler"},
  );
  parser.add_argument(
    ["-n", "--no-keywords"], {action: "store_true",
                              help: "Output result as data, not as a program"},
  );
  parser.add_argument(
    ["--experiment-backend"], {type: "str",
                               help: "force use of 'rust' or 'python' backend"},
  );
  parser.add_argument(
    ["-i", "--include"],
    {
      type: path_join,
      help: "add a search path for included files",
      action: "append",
      default: [],
    },
  );
  parser.add_argument(
    ["path_or_code"], {type: path_or_code,
                       help: "filepath to clvm script, or a literal script"},
  );
  parser.add_argument(
    ["env"], {nargs: "?", type: path_or_code,
              help: "clvm script environment, as clvm src, or hex"},
  );
  
  const parsedArgs = parser.parse_args(args.slice(1));
  
  const keywords = parsedArgs["no_keywords"] ? {} : KEYWORD_FROM_ATOM;
  let run_program: TRunProgram;
  if(typeof (parsedArgs["stage"] as typeof stage_2).run_program_for_search_paths === "function"){
    run_program = (parsedArgs["stage"] as typeof stage_2).run_program_for_search_paths(parsedArgs["include"] as string[]);
  }
  else{
    run_program = (parsedArgs["stage"] as typeof stage_0).run_program;
  }
  
  let input_serialized: Bytes|None = None;
  let input_sexp: SExp|None = None;
  
  const time_start = now();
  let time_read_hex = -1;
  let time_assemble = -1;
  let time_parse_input = -1;
  let time_done = -1;
  if(parsedArgs["hex"]){
    const assembled_serialized = Bytes.from(parsedArgs["path_or_code"] as string, "hex");
    if(!parsedArgs["env"]){
      parsedArgs["env"] = "80";
    }
    const env_serialized = Bytes.from(parsedArgs["env"] as string, "hex");
    time_read_hex = now();
    
    input_serialized = h("0xff").concat(assembled_serialized).concat(env_serialized);
  }
  else{
    const src_text = parsedArgs["path_or_code"] as string;
    let src_sexp;
    try{
      src_sexp = reader.read_ir(src_text);
    }
    catch(ex){
      print(`FAIL: ${ex}`);
      return -1;
    }
    const assembled_sexp = binutils.assemble_from_ir(src_sexp);
    if(!parsedArgs["env"]){
      parsedArgs["env"] = "()";
    }
    const env_ir = reader.read_ir(parsedArgs["env"] as string);
    const env = binutils.assemble_from_ir(env_ir);
    time_assemble = now();
    
    input_sexp = to_sexp_f(t(assembled_sexp, env));
  }
  
  let pre_eval_f: TPreEvalF|None = None;
  let symbol_table: Record<string, string>|None = None;
  const log_entries: Array<[SExp, SExp, Optional<SExp>]> = [];
  
  if(parsedArgs["symbol_table"]){
    symbol_table = JSON.parse(fs_read(parsedArgs["symbol_table"] as string));
    pre_eval_f = make_trace_pre_eval(log_entries, symbol_table);
  }
  else if(parsedArgs["verbose"] || parsedArgs["table"]){
    pre_eval_f = make_trace_pre_eval(log_entries);
  }
  
  const run_script = (parsedArgs["stage"] as Record<string, SExp>)[tool_name];
  
  let cost = 0;
  let result: SExp;
  let output = "(didn't finish)";
  const cost_offset = calculate_cost_offset(run_program, run_script);
  
  try{
    const arg_max_cost = parsedArgs["max_cost"] as number;
    const max_cost = Math.max(0, (arg_max_cost !== 0 ? arg_max_cost - cost_offset : 0));
    const use_rust = (
      tool_name !== "run"
      && !pre_eval_f
      && parsedArgs["experiment_backend"] === "rust"
    );
    
    if(use_rust){
      if(input_serialized === None){
        input_serialized = (input_sexp as SExp).as_bin();
      }
      
      const run_script2 = run_script.as_bin();
      time_parse_input = now();
      
      const run_program_result = run_program_rust(run_script2.raw(), input_serialized.raw());
      time_done = now();
      result = sexp_from_stream(new Stream(new Bytes(run_program_result)), to_sexp_f);
    }
    else{
      if(input_sexp === None){
        input_sexp = sexp_from_stream(new Stream(input_serialized as Bytes), to_sexp_f);
      }
      time_parse_input = now();
      const run_program_result = run_program(
        run_script, input_sexp, {max_cost, pre_eval_f, strict: parsedArgs["strict"] as boolean}
      );
      cost = run_program_result[0] as number;
      result = run_program_result[1] as SExp;
      time_done = now();
    }
    
    if(parsedArgs["cost"]){
      cost += cost > 0 ? cost_offset : 0;
      print(`cost = ${cost}`);
    }
    
    if(parsedArgs["time"]){
      if(parsedArgs["hex"]){
        print(`read_hex: ${time_read_hex - time_start}`);
      }
      else{
        print(`assemble_from_ir: ${time_assemble - time_start}`);
        print(`to_sexp_f: ${time_parse_input - time_assemble}`);
      }
      print(`run_program: ${time_done - time_parse_input}`);
    }
    
    if(parsedArgs["dump"]){
      const blob = as_bin(f => sexp_to_stream(result, f));
      output = blob.hex();
    }
    else if(parsedArgs["quiet"]){
      output = "";
    }
    else{
      output = binutils.disassemble(result, keywords);
    }
  }
  catch (ex) {
    if(ex instanceof EvalError){
      result = to_sexp_f(ex._sexp as CLVMType);
      output = `FAIL: ${ex.message} ${binutils.disassemble(result, keywords)}`;
      return -1;
    }
    output = ex instanceof Error ? ex.message : typeof ex === "string" ? ex : JSON.stringify(ex);
    throw new Error(ex.message);
  }
  finally {
    print(output);
    if(parsedArgs["verbose"] || symbol_table){
      print("");
      trace_to_text(log_entries, binutils.disassemble, symbol_table || {});
    }
    if(parsedArgs["table"]){
      trace_to_table(log_entries, binutils.disassemble, symbol_table);
    }
  }
}

export function read_ir(args: string[]){
  const parser = new argparse.ArgumentParser({description: "Read script and tokenize to IR."});
  parser.add_argument(
    ["script"], {help: "script in hex or uncompiled text"});
  
  const parsedArgs = parser.parse_args(args.slice(1));
  
  const sexp = reader.read_ir(parsedArgs["script"] as string);
  const blob = stream_to_bin(f => sexp_to_stream(sexp, f));
  print(blob.hex());
}

/*
Copyright 2018 Chia Network Inc

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
 */