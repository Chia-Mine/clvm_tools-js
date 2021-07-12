"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run_program_for_search_paths = exports.do_write = exports.do_read = void 0;
const clvm_1 = require("clvm");
const reader_1 = require("../../ir/reader");
const writer_1 = require("../../ir/writer");
const binutils_1 = require("../../clvm_tools/binutils");
const stage_0_1 = require("../stage_0");
const compile_1 = require("./compile");
const optimize_1 = require("./optimize");
const io_1 = require("../../platform/io");
function do_read(args) {
    const filename = args.first().atom;
    const s = io_1.fs_read(filename.decode());
    const ir_sexp = clvm_1.SExp.to(reader_1.read_ir(s));
    const sexp = binutils_1.assemble_from_ir(ir_sexp);
    return clvm_1.t(1, sexp);
}
exports.do_read = do_read;
function do_write(args) {
    const filename = args.first().atom;
    const data = args.rest().first();
    const f = new io_1.FileStream(filename.decode());
    writer_1.write_ir_to_stream(binutils_1.disassemble_to_ir(data, {}), f);
    f.flush();
    return clvm_1.t(1, clvm_1.SExp.to(0));
}
exports.do_write = do_write;
function run_program_for_search_paths(search_paths) {
    const do_full_path_for_name = (args) => {
        const filename = args.first().atom;
        for (const path of search_paths) {
            const f_path = io_1.Path.join(path, filename.decode());
            if (f_path.is_file()) {
                return clvm_1.t(1, clvm_1.SExp.to(clvm_1.b(f_path.toString())));
            }
        }
        throw new clvm_1.EvalError(`can't open ${filename}`, args);
    };
    const _operator_lookup = clvm_1.OperatorDict(clvm_1.OPERATOR_LOOKUP);
    const run_program = (program, args, option) => {
        const operator_lookup = (option && option.operator_lookup) || _operator_lookup;
        option = option ? Object.assign(Object.assign({}, option), { operator_lookup }) : { operator_lookup };
        return stage_0_1.run_program(program, args, option);
    };
    const BINDINGS = {
        [clvm_1.b("com").hex()]: compile_1.make_do_com(run_program),
        [clvm_1.b("opt").hex()]: optimize_1.make_do_opt(run_program),
        [clvm_1.b("_full_path_for_name").hex()]: do_full_path_for_name,
        [clvm_1.b("_read").hex()]: do_read,
        [clvm_1.b("_write").hex()]: do_write,
    };
    Object.entries(BINDINGS).forEach(([key, value]) => {
        _operator_lookup[key] = value;
    });
    return run_program;
}
exports.run_program_for_search_paths = run_program_for_search_paths;
