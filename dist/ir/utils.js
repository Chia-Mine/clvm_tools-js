"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.is_ir = exports.ir_iter = exports.ir_as_symbol = exports.ir_symbol = exports.ir_rest = exports.ir_first = exports.ir_as_atom = exports.ir_is_atom = exports.ir_as_sexp = exports.ir_listp = exports.ir_nullp = exports.ir_val = exports.ir_offset = exports.ir_as_int = exports.ir_type = exports.ir_null = exports.ir_list = exports.ir_cons = exports.ir_new = void 0;
const clvm_1 = require("clvm");
const Type_1 = require("./Type");
function ir_new(type, val, offset) {
    if (typeof offset === "number") {
        type = clvm_1.SExp.to(clvm_1.t(type, offset));
    }
    return clvm_1.SExp.to(clvm_1.t(type, val));
}
exports.ir_new = ir_new;
function ir_cons(first, rest, offset) {
    return ir_new(Type_1.Type.CONS.i, ir_new(first, rest), offset);
}
exports.ir_cons = ir_cons;
function ir_list(...items) {
    if (items && items.length) {
        return ir_cons(items[0], ir_list(...items.slice(1)));
    }
    return ir_null();
}
exports.ir_list = ir_list;
function ir_null() {
    return ir_new(Type_1.Type.NULL.i, 0);
}
exports.ir_null = ir_null;
function ir_type(ir_sexp) {
    let the_type = ir_sexp.first();
    if (the_type.listp()) {
        the_type = the_type.first();
    }
    return clvm_1.int_from_bytes(the_type.atom);
}
exports.ir_type = ir_type;
function ir_as_int(ir_sexp) {
    return clvm_1.int_from_bytes(ir_as_atom(ir_sexp));
}
exports.ir_as_int = ir_as_int;
function ir_offset(ir_sexp) {
    const val = ir_sexp.first();
    let the_offset;
    if (val.listp()) {
        the_offset = val.rest().atom;
    }
    else {
        the_offset = clvm_1.h("0xff");
    }
    return clvm_1.int_from_bytes(the_offset);
}
exports.ir_offset = ir_offset;
function ir_val(ir_sexp) {
    return ir_sexp.rest();
}
exports.ir_val = ir_val;
function ir_nullp(ir_sexp) {
    return ir_type(ir_sexp) === Type_1.Type.NULL.i;
}
exports.ir_nullp = ir_nullp;
function ir_listp(ir_sexp) {
    return Type_1.CONS_TYPES.includes(ir_type(ir_sexp));
}
exports.ir_listp = ir_listp;
function ir_as_sexp(ir_sexp) {
    if (ir_nullp(ir_sexp)) {
        return [];
    }
    else if (ir_type(ir_sexp) === Type_1.Type.CONS.i) {
        return ir_as_sexp(ir_first(ir_sexp)).cons(ir_as_sexp(ir_rest(ir_sexp)));
    }
    return ir_sexp.rest();
}
exports.ir_as_sexp = ir_as_sexp;
function ir_is_atom(ir_sexp) {
    return !ir_listp(ir_sexp);
}
exports.ir_is_atom = ir_is_atom;
function ir_as_atom(ir_sexp) {
    return clvm_1.Bytes.from(ir_sexp.rest().atom);
}
exports.ir_as_atom = ir_as_atom;
function ir_first(ir_sexp) {
    return ir_sexp.rest().first();
}
exports.ir_first = ir_first;
function ir_rest(ir_sexp) {
    return ir_sexp.rest().rest();
}
exports.ir_rest = ir_rest;
function ir_symbol(symbol) {
    return clvm_1.t(Type_1.Type.SYMBOL.i, clvm_1.b(symbol));
}
exports.ir_symbol = ir_symbol;
function ir_as_symbol(ir_sexp) {
    if (ir_sexp.listp() && ir_type(ir_sexp) === Type_1.Type.SYMBOL.i) {
        const b = clvm_1.Bytes.from(ir_as_sexp(ir_sexp).atom);
        return b.decode();
    }
    return clvm_1.None;
}
exports.ir_as_symbol = ir_as_symbol;
function* ir_iter(ir_sexp) {
    while (ir_listp(ir_sexp)) {
        yield ir_first(ir_sexp);
        ir_sexp = ir_rest(ir_sexp);
    }
}
exports.ir_iter = ir_iter;
function is_ir(sexp) {
    if (sexp.atom !== clvm_1.None) {
        return false;
    }
    const [type_sexp, val_sexp] = sexp.pair;
    const f = type_sexp.atom;
    if (f === clvm_1.None || f.length > 1) {
        return false;
    }
    const the_type = clvm_1.int_from_bytes(f);
    let t;
    try {
        t = new Type_1.Type(the_type);
    }
    catch (e) {
        return false;
    }
    if (t.is(Type_1.Type.CONS)) {
        if (val_sexp.atom.equal_to(clvm_1.Bytes.NULL)) {
            return true;
        }
        if (val_sexp.pair) {
            return val_sexp.every((_) => is_ir(_));
        }
        return false;
    }
    return val_sexp.atom !== clvm_1.None;
}
exports.is_ir = is_ir;
