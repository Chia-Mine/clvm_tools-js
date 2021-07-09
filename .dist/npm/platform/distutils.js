"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dep_util = exports.log = void 0;
const io_1 = require("./io");
class log {
    static info(msg) {
        console.log(msg);
    }
}
exports.log = log;
class dep_util {
    static newer(input_path, output_path) {
        const exists_input_file = io_1.fs_exists(input_path);
        if (!exists_input_file) {
            throw new Error("source does not exist");
        }
        const exists_output_file = io_1.fs_exists(output_path);
        if (!exists_output_file) {
            return true;
        }
        const stat_input_file = io_1.fs_stat(input_path);
        const stat_output_file = io_1.fs_stat(output_path);
        return stat_input_file.mtimeMs > stat_output_file.mtimeMs;
    }
}
exports.dep_util = dep_util;
