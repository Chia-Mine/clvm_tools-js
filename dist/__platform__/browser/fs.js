"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readdirSync = exports.statSync = exports.existsSync = exports.writeFileSync = exports.readFileSync = void 0;
function readFileSync(path, option) {
    const data = window.localStorage.getItem(path);
    return data ? JSON.parse(data) : "";
}
exports.readFileSync = readFileSync;
function writeFileSync(path, data) {
    window.localStorage.setItem(path, JSON.stringify(data));
    return;
}
exports.writeFileSync = writeFileSync;
function existsSync(path) {
    return Boolean(window.localStorage.getItem(path));
}
exports.existsSync = existsSync;
function statSync(path) {
    return {
        isFile: () => {
            return existsSync(path);
        },
        mtimeMs: Date.now(),
    };
}
exports.statSync = statSync;
function readdirSync(path) {
    const n = window.localStorage.length;
    const dirEntries = [];
    for (let i = 0; i < n; i++) {
        const key = window.localStorage.key(i);
        if (!key) {
            continue;
        }
        const item = window.localStorage.getItem(key);
        if (!item) {
            continue;
        }
        // Check forbidden chars
        if (/[<>:"\\|?*]/.test(path)) {
            throw new Error("path contains invalid character");
        }
        // Remove trailing '/'
        path = path.replace(/[/]+$/, "");
        // escape '.'
        path = path.replace(/[.]/g, "[.]");
        const isDescendantRegex = new RegExp(`^${path}/`);
        if (!isDescendantRegex.test(key)) {
            continue;
        }
        const isDirectChildFileRegex = new RegExp(`^${path}/[^/]+$`);
        if (isDirectChildFileRegex.test(key)) {
            dirEntries.push({
                name: key,
                isDirectory: () => false,
            });
            continue;
        }
        const isDirectChildDirRegex = new RegExp(`^(${path}/[^/]+)/[^/]+`);
        const dirname = isDirectChildDirRegex.exec(key);
        if (dirname) {
            dirEntries.push({
                name: dirname[1],
                isDirectory: () => true,
            });
        }
    }
    return dirEntries;
}
exports.readdirSync = readdirSync;
