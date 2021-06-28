"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArgumentParser = void 0;
function isOptional(arg) {
    return /^[-]./.test(arg);
}
class ArgumentParser {
    constructor(props) {
        this._prog = "prog";
        this._desc = "";
        this._positional_args = [];
        this._optional_args = [];
        if (props) {
            if (props.description) {
                this._desc = props.description;
            }
            if (props.prog) {
                this._prog = props.prog;
            }
        }
        this._optional_args.push({
            names: ["-h", "--help"],
            options: { help: "Show help message", action: "store_true" },
        });
    }
    _getConverter(type) {
        if (!type || type === "str") { // string
            return (v) => v;
        }
        else if (type === "int") {
            return (v) => {
                const n = +v;
                if (isNaN(n) || !isFinite(n)) {
                    const usage = this.compileHelpMessages();
                    throw `${usage}\n\nError: Invalid parameter: ${v}`;
                }
                return n;
            };
        }
        else if (typeof type === "function") {
            return type;
        }
        else {
            const usage = this.compileHelpMessages();
            throw `${usage}\n\nError: Unknown type: ${type}`;
        }
    }
    _getOptionalArgName(arg) {
        const names = arg.names;
        const doubleHyphenArgIndex = names.findIndex(n => /^[-]{2}/.test(n));
        if (doubleHyphenArgIndex > -1) {
            const name = names[doubleHyphenArgIndex];
            return name.replace(/^[-]+/, "").replace(/[-]/g, "_");
        }
        const singleHyphenArgIndex = names.findIndex(n => /^[-][^-]/.test(n));
        if (singleHyphenArgIndex > -1) {
            const name = names[singleHyphenArgIndex];
            return name.replace(/^[-]/, "").replace(/[-]/g, "_");
        }
        throw new Error("Invalid argument name");
    }
    add_argument(argName, options) {
        if (!argName || argName.length < 1) {
            throw new Error("Argument name is missing");
        }
        else if (argName.length === 1 && !isOptional(argName[0])) {
            this._positional_args.push({
                names: argName,
                options: options || {},
            });
        }
        else {
            this._optional_args.push({
                names: argName,
                options: options || {},
            });
        }
    }
    parse_args(args) {
        const params = {};
        // Set default value
        for (let k = 0; k < this._optional_args.length; k++) {
            const optional_arg_k = this._optional_args[k];
            const defaultValue = optional_arg_k.options.default;
            if (typeof defaultValue === "undefined") {
                continue;
            }
            const name = this._getOptionalArgName(optional_arg_k);
            params[name] = defaultValue;
        }
        const input_positional_args = [];
        for (let i = 0; i < args.length; i++) {
            const arg = args[i];
            // positional argument
            if (!isOptional(arg)) {
                input_positional_args.push(arg);
                continue;
            }
            const optional_arg = this._optional_args.find(a => a.names.includes(arg));
            if (!optional_arg) {
                const usage = this.compileHelpMessages();
                throw `${usage}\n\nError: Unknown option: ${arg}`;
            }
            const name = this._getOptionalArgName(optional_arg);
            if (optional_arg.options.action === "store_true") {
                params[name] = true;
                continue;
            }
            const converter = this._getConverter(optional_arg.options.type);
            ++i;
            const value = args[i];
            if (!value && !optional_arg.options.default) {
                const usage = this.compileHelpMessages();
                throw `${usage}\n\nError: ${name} requires a value`;
            }
            if (!optional_arg.options.action || optional_arg.options.action === "store") {
                params[name] = converter(value) || optional_arg.options.default;
            }
            else if (optional_arg.options.action === "append") {
                const param_value = (params[name] || []);
                params[name] = param_value.concat(converter(value) || optional_arg.options.default);
            }
            else {
                const usage = this.compileHelpMessages();
                throw `${usage}\n\nError: Unknown action: ${optional_arg.options.action}`;
            }
        }
        let i = 0;
        for (let k = 0; k < this._positional_args.length; k++) {
            const positional_arg_k = this._positional_args[k];
            let input_arg = input_positional_args[i];
            const name = positional_arg_k.names[0];
            const nargs = positional_arg_k.options.nargs;
            const converter = this._getConverter(positional_arg_k.options.type);
            if (typeof nargs === "undefined") {
                params[name] = converter(input_arg);
                i++;
            }
            else if (typeof nargs === "number") {
                for (let j = 0; j < nargs; j++) {
                    if (i >= input_positional_args.length) {
                        const usage = this.compileHelpMessages();
                        throw `${usage}\n\nError: Requires ${nargs} positional arguments but got ${i}`;
                    }
                    input_arg = input_positional_args[i];
                    const param_value = (params[name] || []);
                    params[name] = param_value.concat(converter(input_arg));
                    i++;
                }
            }
            else if (nargs === "?") {
                if (i >= input_positional_args.length) {
                    if (typeof positional_arg_k.options.default === "undefined") {
                        params[name] = converter("");
                        i++;
                        continue;
                    }
                    params[name] = positional_arg_k.options.default;
                    i++;
                }
                else {
                    params[name] = converter(input_arg);
                    i++;
                }
            }
            else if (nargs === "*" || nargs === "+") {
                if (i >= input_positional_args.length) {
                    if (nargs === "+") {
                        const usage = this.compileHelpMessages();
                        throw `${usage}\n\nError: The following arguments are required: ${name}`;
                    }
                    params[name] = [];
                    i++;
                    continue;
                }
                for (; i < input_positional_args.length; i++) {
                    input_arg = input_positional_args[i];
                    const param_value = (params[name] || []);
                    params[name] = param_value.concat(converter(input_arg));
                }
            }
            else {
                throw `Unknown nargs: ${nargs}. It is a program bug. Contact a developer and report this error.`;
            }
        }
        if (params["help"]) {
            const usage = this.compileHelpMessages();
            throw `${usage}`;
        }
        return params;
    }
    compileHelpMessages() {
        const iterator = (a) => {
            let msg = `${a.names[0]}`;
            if (a.options.help) {
                msg += ` ${a.options.help}`;
                msg = msg.replace(/%\(prog\)s/, this._prog);
                msg = msg.replace(/%\(default\)s/, a.options.default || "");
            }
            return msg;
        };
        const messages = [
            `usage: ${this._prog} ` + this._optional_args.concat(this._positional_args).map(a => `[${a.names[0]}]`).join(" "),
        ];
        if (this._positional_args.length > 0) {
            messages.push("");
            messages.push("positional arguments:");
            messages.push(...this._positional_args.map(iterator));
        }
        if (this._optional_args.length > 0) {
            messages.push("");
            messages.push("optional arguments:");
            messages.push(...this._optional_args.map(iterator));
        }
        return messages.join("\n");
    }
}
exports.ArgumentParser = ArgumentParser;
