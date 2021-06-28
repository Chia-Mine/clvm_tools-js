"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assemble = exports.disassemble = exports.disassemble_to_ir = exports.type_for_atom = exports.assemble_from_ir = void 0;
const clvm_1 = require("clvm");
const reader_1 = require("../ir/reader");
const writer_1 = require("../ir/writer");
const utils_1 = require("../ir/utils");
const Type_1 = require("../ir/Type");
function isPrintable(s) {
    // eslint-disable-next-line no-control-regex
    const regex = /^[0-9a-zA-Z!"#$%&'()*+,-./:;<=>?@\\[\]^_`{|}~ \t\n\r\x0b\x0c]+$/;
    return regex.test(s);
}
function assemble_from_ir(ir_sexp) {
    let keyword = utils_1.ir_as_symbol(ir_sexp);
    if (keyword) {
        if (keyword[0] === "#") {
            keyword = keyword.substring(1);
        }
        const atom = clvm_1.KEYWORD_TO_ATOM[keyword];
        if (atom) {
            return clvm_1.SExp.to(clvm_1.h(atom));
        }
        else {
            return utils_1.ir_val(ir_sexp);
        }
        // Original code raises an Error, which never reaches.
        // throw new SyntaxError(`can't parse ${keyrowd} at ${ir_sexp._offset}`);
    }
    if (!utils_1.ir_listp(ir_sexp)) {
        return utils_1.ir_val(ir_sexp);
    }
    if (utils_1.ir_nullp(ir_sexp)) {
        return clvm_1.SExp.to([]);
    }
    // handle "q"
    const first = utils_1.ir_first(ir_sexp);
    keyword = utils_1.ir_as_symbol(first);
    if (keyword === "q") {
        // pass;
    }
    const sexp_1 = assemble_from_ir(first);
    const sexp_2 = assemble_from_ir(utils_1.ir_rest(ir_sexp));
    return sexp_1.cons(sexp_2);
}
exports.assemble_from_ir = assemble_from_ir;
function type_for_atom(atom) {
    if (atom.length > 2) {
        try {
            const v = atom.decode();
            if (isPrintable(v)) {
                return Type_1.Type.QUOTES.i;
            }
        }
        catch (e) {
            // do nothing
        }
        return Type_1.Type.HEX.i;
    }
    if (clvm_1.int_to_bytes(clvm_1.int_from_bytes(atom)).equal_to(atom)) {
        return Type_1.Type.INT.i;
    }
    return Type_1.Type.HEX.i;
}
exports.type_for_atom = type_for_atom;
function disassemble_to_ir(sexp, keyword_from_atom, allow_keyword) {
    if (utils_1.is_ir(sexp) && allow_keyword !== false) {
        return utils_1.ir_cons(utils_1.ir_symbol("ir"), sexp);
    }
    if (sexp.listp()) {
        if (sexp.first().listp() || allow_keyword !== false) {
            allow_keyword = true;
        }
        const v0 = disassemble_to_ir(sexp.first(), keyword_from_atom, allow_keyword);
        const v1 = disassemble_to_ir(sexp.rest(), keyword_from_atom, false);
        return utils_1.ir_cons(v0, v1);
    }
    const as_atom = sexp.atom;
    if (allow_keyword) {
        const v = keyword_from_atom[as_atom.hex()];
        if (v && v !== ".") {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            return utils_1.ir_symbol(v); // @todo Find a good way not to use `ts-ignore`
        }
    }
    if (sexp.nullp()) {
        return utils_1.ir_null();
    }
    return clvm_1.SExp.to(clvm_1.t(type_for_atom(as_atom), as_atom));
}
exports.disassemble_to_ir = disassemble_to_ir;
function disassemble(sexp, keyword_from_atom = clvm_1.KEYWORD_FROM_ATOM) {
    const symbols = disassemble_to_ir(sexp, keyword_from_atom);
    return writer_1.write_ir(symbols);
}
exports.disassemble = disassemble;
function assemble(s) {
    const symbols = reader_1.read_ir(s);
    return assemble_from_ir(symbols);
}
exports.assemble = assemble;
