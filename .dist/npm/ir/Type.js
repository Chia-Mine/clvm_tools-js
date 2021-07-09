"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONS_TYPES = exports.Type = void 0;
const clvm_1 = require("clvm");
function i(b) {
    return clvm_1.int_from_bytes(b);
}
const types = {
    CONS: i(clvm_1.b("CONS")),
    NULL: i(clvm_1.b("NULL")),
    INT: i(clvm_1.b("INT")),
    HEX: i(clvm_1.b("HEX")),
    QUOTES: i(clvm_1.b("QT")),
    DOUBLE_QUOTE: i(clvm_1.b("DQT")),
    SINGLE_QUOTE: i(clvm_1.b("SQT")),
    SYMBOL: i(clvm_1.b("SYM")),
    OPERATOR: i(clvm_1.b("OP")),
    CODE: i(clvm_1.b("CODE")),
    NODE: i(clvm_1.b("NODE")),
};
function isValidType(i) {
    return Object.values(types).includes(i);
}
class Type {
    constructor(i) {
        if (typeof i === "number") {
            if (!isValidType(i)) {
                throw new Error(`${i} is not a valid Type`);
            }
            this._i = i;
        }
        else {
            this._i = i.i;
        }
    }
    get i() {
        return this._i;
    }
    get length() {
        return clvm_1.limbs_for_int(this.i);
    }
    get atom() {
        return clvm_1.int_to_bytes(this.i);
    }
    is(other) {
        return this._i === other.i;
    }
    listp() {
        return false;
    }
}
exports.Type = Type;
Type.CONS = new Type(types.CONS);
Type.NULL = new Type(types.NULL);
Type.INT = new Type(types.INT);
Type.HEX = new Type(types.HEX);
Type.QUOTES = new Type(types.QUOTES);
Type.DOUBLE_QUOTE = new Type(types.DOUBLE_QUOTE);
Type.SINGLE_QUOTE = new Type(types.SINGLE_QUOTE);
Type.SYMBOL = new Type(types.SYMBOL);
Type.OPERATOR = new Type(types.OPERATOR);
Type.CODE = new Type(types.CODE);
Type.NODE = new Type(types.NODE);
exports.CONS_TYPES = [Type.CONS.i];
