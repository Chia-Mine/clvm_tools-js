"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.find_files = exports.compile_clvm = exports.compile_clvm_text = void 0;
const distutils_1 = require("../platform/distutils");
const io_1 = require("../platform/io");
const reader = require("../ir/reader");
const binutils = require("./binutils");
const stage_2 = require("../stages/stage_2");
const clvm_1 = require("clvm");
function compile_clvm_text(text, search_paths) {
    const ir_src = reader.read_ir(text);
    const assembled_sexp = binutils.assemble_from_ir(ir_src);
    const input_sexp = clvm_1.SExp.to(clvm_1.t(assembled_sexp, []));
    const run_program = stage_2.run_program_for_search_paths(search_paths);
    const run_program_output = run_program(stage_2.run, input_sexp);
    return run_program_output[1];
}
exports.compile_clvm_text = compile_clvm_text;
function compile_clvm(input_path, output_path, search_paths = []) {
    if (distutils_1.dep_util.newer(input_path, output_path)) {
        distutils_1.log.info(`clvmcc ${input_path} -o ${output_path}`);
        const text = io_1.fs_read(input_path);
        const result = compile_clvm_text(text, search_paths);
        const hex = result.as_bin().hex();
        const f = new io_1.FileStream(output_path);
        f.write(hex);
        f.write("\n");
        f.flush();
    }
    else {
        distutils_1.log.info(`skipping ${input_path}, compiled recently`);
    }
    return output_path;
}
exports.compile_clvm = compile_clvm;
function find_files(path = "") {
    const r = [];
    for (const { dirpath, filenames } of io_1.os_walk(path)) {
        for (const filename of filenames) {
            if (filename.endsWith(".clvm")) {
                const full_path = io_1.path_join(dirpath, filename);
                const target = `${full_path}.hex}`;
                compile_clvm(full_path, target);
                r.push(target);
            }
        }
    }
    return r;
}
exports.find_files = find_files;
