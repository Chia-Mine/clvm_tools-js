"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.write_ir = exports.write_ir_to_stream = exports.iter_ir_format = exports.iter_sexp_format = void 0;
const clvm_1 = require("clvm");
const Type_1 = require("./Type");
const utils_1 = require("./utils");
function* iter_sexp_format(ir_sexp) {
    yield "(";
    let is_first = true;
    while (!utils_1.ir_nullp(ir_sexp)) {
        if (!utils_1.ir_listp(ir_sexp)) {
            yield " . ";
            yield* iter_ir_format(ir_sexp);
            break;
        }
        if (!is_first) {
            yield " ";
        }
        for (const _ of iter_ir_format(utils_1.ir_first(ir_sexp))) {
            yield _;
        }
        ir_sexp = utils_1.ir_rest(ir_sexp);
        is_first = false;
    }
    yield ")";
}
exports.iter_sexp_format = iter_sexp_format;
function* iter_ir_format(ir_sexp) {
    if (utils_1.ir_listp(ir_sexp)) {
        yield* iter_sexp_format(ir_sexp);
        return;
    }
    const type = utils_1.ir_type(ir_sexp);
    if (type === Type_1.Type.CODE.i) {
        const bio = new clvm_1.Stream();
        clvm_1.sexp_to_stream(utils_1.ir_val(ir_sexp), bio);
        const code = bio.getValue().as_word().toString();
        yield `CODE[${code}]`;
        return;
    }
    if (type === Type_1.Type.NULL.i) {
        yield "()";
        return;
    }
    const atom = utils_1.ir_as_atom(ir_sexp);
    if (type === Type_1.Type.INT.i) {
        yield `${clvm_1.int_from_bytes(atom)}`;
    }
    else if (type === Type_1.Type.NODE.i) {
        yield `NODE[${clvm_1.int_from_bytes(atom)}]`;
    }
    else if (type === Type_1.Type.HEX.i) {
        yield `0x${atom.hex()}`;
    }
    else if (type === Type_1.Type.QUOTES.i) {
        yield `"${atom.decode()}"`;
    }
    else if (type === Type_1.Type.DOUBLE_QUOTE.i) {
        yield `"${atom.decode()}"`;
    }
    else if (type === Type_1.Type.SINGLE_QUOTE.i) {
        yield `'${atom.decode()}'`;
    }
    else if (type === Type_1.Type.SYMBOL.i || type === Type_1.Type.OPERATOR.i) {
        try {
            yield atom.decode();
        }
        catch (e) {
            yield `(indecipherable symbol: ${atom.hex()})`;
        }
    }
    else {
        throw new SyntaxError(`bad ir format: ${ir_sexp}`);
    }
}
exports.iter_ir_format = iter_ir_format;
function write_ir_to_stream(ir_sexp, f) {
    for (const _ of iter_ir_format(ir_sexp)) {
        f.write(clvm_1.b(_));
    }
}
exports.write_ir_to_stream = write_ir_to_stream;
function write_ir(ir_sexp) {
    const s = new clvm_1.Stream();
    write_ir_to_stream(ir_sexp, s);
    return s.getValue().decode();
}
exports.write_ir = write_ir;
