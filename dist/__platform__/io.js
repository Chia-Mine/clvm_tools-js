"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Path = exports.FileStream = exports.path_join = exports.os_walk = exports.fs_stat = exports.fs_exists = exports.fs_isFile = exports.fs_readdir = exports.fs_read = exports.fs_write = void 0;
const clvm_1 = require("clvm");
function fs_write(path, data) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const FS = require("fs");
    FS.writeFileSync(path, data);
}
exports.fs_write = fs_write;
function fs_read(path) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const FS = require("fs");
    return FS.readFileSync(path, { encoding: "utf8" });
}
exports.fs_read = fs_read;
function fs_readdir(path) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const FS = require("fs");
    return FS.readdirSync(path, { encoding: "utf8", withFileTypes: true });
}
exports.fs_readdir = fs_readdir;
function fs_isFile(path) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const FS = require("fs");
    const stat = FS.statSync(path);
    return stat.isFile();
}
exports.fs_isFile = fs_isFile;
function fs_exists(path) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const FS = require("fs");
    return FS.existsSync(path);
}
exports.fs_exists = fs_exists;
function fs_stat(path) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const FS = require("fs");
    return FS.statSync(path);
}
exports.fs_stat = fs_stat;
function os_walk(dirpath, stack) {
    const entries = fs_readdir(dirpath);
    const result = {
        dirpath,
        dirnames: [],
        filenames: [],
    };
    stack = stack || [];
    for (const d of entries) {
        if (d.isDirectory()) {
            result.dirnames.push(d.name);
            os_walk(path_join(dirpath, d.name), stack);
            continue;
        }
        result.filenames.push(d.name);
    }
    stack.push(result);
    return stack;
}
exports.os_walk = os_walk;
function path_join(...paths) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const PATH = require("path");
    return PATH.resolve(...paths);
}
exports.path_join = path_join;
class FileStream extends clvm_1.Stream {
    constructor(path) {
        super();
        this._path = path;
    }
    write(data) {
        const d = data instanceof clvm_1.Bytes ? data : clvm_1.b(data);
        return super.write(d);
    }
    flush() {
        const data = this.getValue();
        fs_write(this._path, data.decode());
    }
}
exports.FileStream = FileStream;
class Path {
    constructor(p) {
        this._path = p;
    }
    static join(...paths) {
        const p = path_join(...paths);
        return new Path(p);
    }
    is_file() {
        return fs_isFile(this._path);
    }
    toString() {
        return this._path;
    }
}
exports.Path = Path;
