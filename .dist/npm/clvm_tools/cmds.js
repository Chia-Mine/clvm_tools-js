"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.read_ir = exports.launch_tool = exports.calculate_cost_offset = exports.brun = exports.run = exports.as_bin = exports.stage_import = exports.opd = exports.opc = exports.call_tool = exports.stream_to_bin = exports.path_or_code = void 0;
const clvm_1 = require("clvm");
const reader = require("../ir/reader");
const binutils = require("./binutils");
const debug_1 = require("./debug");
const sha256tree_1 = require("./sha256tree");
const io_1 = require("../platform/io");
const __type_compatibility__1 = require("clvm/dist/__type_compatibility__");
const argparse = require("../platform/argparse");
const stage_0 = require("../stages/stage_0");
const stage_1 = require("../stages/stage_1");
const stage_2 = require("../stages/stage_2/index");
const performance_1 = require("../platform/performance");
const print_1 = require("../platform/print");
function path_or_code(arg) {
    try {
        if (!io_1.fs_exists(arg) || !io_1.fs_isFile(arg)) {
            return arg;
        }
        return io_1.fs_read(arg);
    }
    catch (e) {
        return arg;
    }
}
exports.path_or_code = path_or_code;
function stream_to_bin(write_f) {
    const f = new __type_compatibility__1.Stream();
    write_f(f);
    return f.getValue();
}
exports.stream_to_bin = stream_to_bin;
function call_tool(tool_name, desc, conversion, input_args) {
    const parser = new argparse.ArgumentParser({ description: desc });
    parser.add_argument(["-H", "--script-hash"], { action: "store_true", help: "Show only sha256 tree hash of program" });
    parser.add_argument(["path_or_code"], { nargs: "*", type: path_or_code, help: "path to clvm script, or literal script" });
    const args = parser.parse_args(input_args.slice(1));
    for (const program of args["path_or_code"]) {
        if (program === "-") {
            throw new Error("Read stdin is not supported at this time");
        }
        const [sexp, text] = conversion(program);
        if (args["script_hash"]) {
            print_1.print(sha256tree_1.sha256tree(sexp).hex());
        }
        else if (text) {
            print_1.print(text);
        }
    }
}
exports.call_tool = call_tool;
function opc(args) {
    function conversion(text) {
        try {
            const ir_sexp = reader.read_ir(text);
            const sexp = binutils.assemble_from_ir(ir_sexp);
            return clvm_1.t(sexp, sexp.as_bin().hex());
        }
        catch (ex) {
            print_1.print(`${ex instanceof Error ? ex.message : JSON.stringify(ex)}`);
            return clvm_1.t(clvm_1.None, clvm_1.None);
        }
    }
    call_tool("opc", "Compile a clvm script.", conversion, args);
}
exports.opc = opc;
function opd(args) {
    function conversion(hexText) {
        const sexp = clvm_1.sexp_from_stream(new __type_compatibility__1.Stream(clvm_1.Bytes.from(hexText, "hex")), clvm_1.to_sexp_f);
        return clvm_1.t(sexp, binutils.disassemble(sexp));
    }
    call_tool("opd", "Disassemble a compiled clvm script from hex.", conversion, args);
}
exports.opd = opd;
function stage_import(stage) {
    if (stage === "0") {
        return stage_0;
    }
    else if (stage === "1") {
        return stage_1;
    }
    else if (stage === "2") {
        return stage_2;
    }
    throw new Error(`Unknown stage: ${stage}`);
}
exports.stage_import = stage_import;
function as_bin(streamer_f) {
    const f = new __type_compatibility__1.Stream();
    streamer_f(f);
    return f.getValue();
}
exports.as_bin = as_bin;
function run(args) {
    return launch_tool(args, "run", 2);
}
exports.run = run;
function brun(args) {
    return launch_tool(args, "brun");
}
exports.brun = brun;
function calculate_cost_offset(run_program, run_script) {
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
    const cost = result[0];
    return 53 - cost;
}
exports.calculate_cost_offset = calculate_cost_offset;
function launch_tool(args, tool_name, default_stage = 0) {
    const parser = new argparse.ArgumentParser({
        prog: ["clvm_tools", tool_name].join(" "),
        description: "Execute a clvm script.",
    });
    parser.add_argument(["--strict"], { action: "store_true",
        help: "Unknown opcodes are always fatal errors in strict mode" });
    parser.add_argument(["-x", "--hex"], { action: "store_true",
        help: "Read program and environment as hexadecimal bytecode" });
    parser.add_argument(["-s", "--stage"], { type: stage_import,
        help: "stage number to include", default: stage_import(default_stage.toString()) });
    parser.add_argument(["-v", "--verbose"], { action: "store_true",
        help: "Display resolve of all reductions, for debugging" });
    parser.add_argument(["-t", "--table"], { action: "store_true",
        help: "Print diagnostic table of reductions, for debugging" });
    parser.add_argument(["-c", "--cost"], { action: "store_true", help: "Show cost" });
    parser.add_argument(["--time"], { action: "store_true", help: "Print execution time" });
    parser.add_argument(["-m", "--max-cost"], { type: "int", default: 11000000000, help: "Maximum cost" });
    parser.add_argument(["-d", "--dump"], { action: "store_true",
        help: "dump hex version of final output" });
    parser.add_argument(["--quiet"], { action: "store_true", help: "Suppress printing the program result" });
    parser.add_argument(["-y", "--symbol-table"], { type: io_1.path_join,
        help: ".SYM file generated by compiler" });
    parser.add_argument(["-n", "--no-keywords"], { action: "store_true",
        help: "Output result as data, not as a program" });
    /*
    parser.add_argument(
      ["--backend"], {type: "str",
        help: "force use of 'rust' or 'python' backend"},
    );
     */
    parser.add_argument(["-i", "--include"], {
        type: io_1.path_join,
        help: "add a search path for included files",
        action: "append",
        default: [],
    });
    parser.add_argument(["path_or_code"], { type: path_or_code,
        help: "filepath to clvm script, or a literal script" });
    parser.add_argument(["env"], { nargs: "?", type: path_or_code,
        help: "clvm script environment, as clvm src, or hex" });
    const parsedArgs = parser.parse_args(args.slice(1));
    const keywords = parsedArgs["no_keywords"] ? {} : clvm_1.KEYWORD_FROM_ATOM;
    let run_program;
    if (typeof parsedArgs["stage"].run_program_for_search_paths === "function") {
        run_program = parsedArgs["stage"].run_program_for_search_paths(parsedArgs["include"]);
    }
    else {
        run_program = parsedArgs["stage"].run_program;
    }
    let input_serialized = clvm_1.None;
    let input_sexp = clvm_1.None;
    const time_start = performance_1.now();
    let time_read_hex = -1;
    let time_assemble = -1;
    let time_parse_input = -1;
    let time_done = -1;
    if (parsedArgs["hex"]) {
        const assembled_serialized = clvm_1.Bytes.from(parsedArgs["path_or_code"], "hex");
        if (!parsedArgs["env"]) {
            parsedArgs["env"] = "80";
        }
        const env_serialized = clvm_1.Bytes.from(parsedArgs["env"], "hex");
        time_read_hex = performance_1.now();
        input_serialized = clvm_1.h("0xff").concat(assembled_serialized).concat(env_serialized);
    }
    else {
        const src_text = parsedArgs["path_or_code"];
        let src_sexp;
        try {
            src_sexp = reader.read_ir(src_text);
        }
        catch (ex) {
            print_1.print(`FAIL: ${ex}`);
            return -1;
        }
        const assembled_sexp = binutils.assemble_from_ir(src_sexp);
        if (!parsedArgs["env"]) {
            parsedArgs["env"] = "()";
        }
        const env_ir = reader.read_ir(parsedArgs["env"]);
        const env = binutils.assemble_from_ir(env_ir);
        time_assemble = performance_1.now();
        input_sexp = clvm_1.to_sexp_f(clvm_1.t(assembled_sexp, env));
    }
    let pre_eval_f = clvm_1.None;
    let symbol_table = clvm_1.None;
    const log_entries = [];
    if (parsedArgs["symbol_table"]) {
        symbol_table = JSON.parse(io_1.fs_read(parsedArgs["symbol_table"]));
        pre_eval_f = debug_1.make_trace_pre_eval(log_entries, symbol_table);
    }
    else if (parsedArgs["verbose"] || parsedArgs["table"]) {
        pre_eval_f = debug_1.make_trace_pre_eval(log_entries);
    }
    const run_script = parsedArgs["stage"][tool_name];
    let cost = 0;
    let result;
    let output = "(didn't finish)";
    const cost_offset = calculate_cost_offset(run_program, run_script);
    try {
        const arg_max_cost = parsedArgs["max_cost"];
        const max_cost = Math.max(0, (arg_max_cost !== 0 ? arg_max_cost - cost_offset : 0));
        // if use_rust: ...
        // else
        if (input_sexp === clvm_1.None) {
            input_sexp = clvm_1.sexp_from_stream(new __type_compatibility__1.Stream(input_serialized), clvm_1.to_sexp_f);
        }
        time_parse_input = performance_1.now();
        const run_program_result = run_program(run_script, input_sexp, { max_cost, pre_eval_f, strict: parsedArgs["strict"] });
        cost = run_program_result[0];
        result = run_program_result[1];
        time_done = performance_1.now();
        if (parsedArgs["cost"]) {
            cost += cost > 0 ? cost_offset : 0;
            print_1.print(`cost = ${cost}`);
        }
        if (parsedArgs["time"]) {
            if (parsedArgs["hex"]) {
                print_1.print(`read_hex: ${time_read_hex - time_start}`);
            }
            else {
                print_1.print(`assemble_from_ir: ${time_assemble - time_start}`);
                print_1.print(`to_sexp_f: ${time_parse_input - time_assemble}`);
            }
            print_1.print(`run_program: ${time_done - time_parse_input}`);
        }
        if (parsedArgs["dump"]) {
            const blob = as_bin(f => clvm_1.sexp_to_stream(result, f));
            output = blob.hex();
        }
        else if (parsedArgs["quiet"]) {
            output = "";
        }
        else {
            output = binutils.disassemble(result, keywords);
        }
    }
    catch (ex) {
        if (ex instanceof clvm_1.EvalError) {
            result = clvm_1.to_sexp_f(ex._sexp);
            output = `FAIL: ${ex.message} ${binutils.disassemble(result, keywords)}`;
            return -1;
        }
        output = ex instanceof Error ? ex.message : typeof ex === "string" ? ex : JSON.stringify(ex);
        throw new Error(ex.message);
    }
    finally {
        print_1.print(output);
        if (parsedArgs["verbose"] || symbol_table) {
            print_1.print("");
            debug_1.trace_to_text(log_entries, binutils.disassemble, symbol_table || {});
        }
        if (parsedArgs["table"]) {
            debug_1.trace_to_table(log_entries, binutils.disassemble, symbol_table);
        }
    }
}
exports.launch_tool = launch_tool;
function read_ir(args) {
    const parser = new argparse.ArgumentParser({ description: "Read script and tokenize to IR." });
    parser.add_argument(["script"], { help: "script in hex or uncompiled text" });
    const parsedArgs = parser.parse_args(args.slice(1));
    const sexp = reader.read_ir(parsedArgs["script"]);
    const blob = stream_to_bin(f => clvm_1.sexp_to_stream(sexp, f));
    print_1.print(blob.hex());
}
exports.read_ir = read_ir;
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
