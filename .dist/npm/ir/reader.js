"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.read_ir = exports.token_stream = exports.tokenize_sexp = exports.tokenize_symbol = exports.tokenize_quotes = exports.tokenize_hex = exports.tokenize_int = exports.tokenize_cons = exports.next_cons_token = exports.consume_until_whitespace = exports.consume_whitespace = void 0;
const clvm_1 = require("clvm");
const Type_1 = require("./Type");
const utils_1 = require("./utils");
const for_of_1 = require("../platform/for_of");
function consume_whitespace(s, offset) {
    // This also deals with comments
    // eslint-disable-next-line no-constant-condition
    while (true) {
        while (offset < s.length && /\s+/.test(s[offset])) {
            offset += 1;
        }
        if (offset >= s.length || s[offset] !== ";") {
            break;
        }
        while (offset < s.length && !/[\n\r]/.test(s[offset])) {
            offset += 1;
        }
    }
    return offset;
}
exports.consume_whitespace = consume_whitespace;
function consume_until_whitespace(s, offset) {
    const start = offset;
    while (offset < s.length && !/\s+/.test(s[offset]) && s[offset] !== ")") {
        offset += 1;
    }
    return clvm_1.t(s.substring(start, offset), offset);
}
exports.consume_until_whitespace = consume_until_whitespace;
function next_cons_token(stream) {
    let token = "";
    let offset = -1;
    // Fix generator spec incompatibility between python and javascript.
    // Javascript iterator cannot be re-used while python can.
    /*
    for(const s of stream){
      found = true;
      ([token, offset] = s);
      break;
    }
     */
    const isExecutedOnce = for_of_1.for_of(stream, (value) => {
        ([token, offset] = value);
        return "stop";
    });
    if (!isExecutedOnce) {
        throw new SyntaxError("missing )");
    }
    return clvm_1.t(token, offset);
}
exports.next_cons_token = next_cons_token;
function tokenize_cons(token, offset, stream) {
    if (token === ")") {
        return utils_1.ir_new(Type_1.Type.NULL.i, 0, offset);
    }
    const initial_offset = offset;
    const first_sexp = tokenize_sexp(token, offset, stream);
    ([token, offset] = next_cons_token(stream));
    let rest_sexp;
    if (token === ".") {
        const dot_offset = offset;
        // grab the last item
        ([token, offset] = next_cons_token(stream));
        rest_sexp = tokenize_sexp(token, offset, stream);
        ([token, offset] = next_cons_token(stream));
        if (token !== ")") {
            throw new SyntaxError(`illegal dot expression at ${dot_offset}`);
        }
    }
    else {
        rest_sexp = tokenize_cons(token, offset, stream);
    }
    return utils_1.ir_cons(first_sexp, rest_sexp, initial_offset);
}
exports.tokenize_cons = tokenize_cons;
function tokenize_int(token, offset) {
    try {
        // Don't recognize hex string to int
        if (token.slice(0, 2).toUpperCase() === "0X") {
            return clvm_1.None;
        }
        const nToken = +token;
        if (isNaN(nToken) || !isFinite(nToken)) {
            return clvm_1.None;
        }
        return utils_1.ir_new(Type_1.Type.INT.i, nToken, offset);
    }
    catch (e) {
        // Skip
    }
    return clvm_1.None;
}
exports.tokenize_int = tokenize_int;
function tokenize_hex(token, offset) {
    if (token.slice(0, 2).toUpperCase() === "0X") {
        try {
            token = token.substring(2);
            if (token.length % 2 === 1) {
                token = `0${token}`;
            }
            return utils_1.ir_new(Type_1.Type.HEX.i, clvm_1.Bytes.from(token, "hex"), offset);
        }
        catch (e) {
            throw new SyntaxError(`invalid hex at ${offset}: 0x${token}`);
        }
    }
    return clvm_1.None;
}
exports.tokenize_hex = tokenize_hex;
function tokenize_quotes(token, offset) {
    if (token.length < 2) {
        return clvm_1.None;
    }
    const c = token[0];
    if (!/['"]/.test(c)) {
        return clvm_1.None;
    }
    if (token[token.length - 1] !== c) {
        throw new SyntaxError(`unterminated string starting at ${offset}: ${token}`);
    }
    const q_type = c === "'" ? Type_1.Type.SINGLE_QUOTE : Type_1.Type.DOUBLE_QUOTE;
    return clvm_1.t(clvm_1.t(q_type.i, offset), clvm_1.b(token.substring(1, token.length - 1)));
}
exports.tokenize_quotes = tokenize_quotes;
function tokenize_symbol(token, offset) {
    return clvm_1.t(clvm_1.t(Type_1.Type.SYMBOL.i, offset), clvm_1.b(token));
}
exports.tokenize_symbol = tokenize_symbol;
function tokenize_sexp(token, offset, stream) {
    if (token === "(") {
        const [token, offset] = next_cons_token(stream);
        return tokenize_cons(token, offset, stream);
    }
    for (const f of [
        tokenize_int,
        tokenize_hex,
        tokenize_quotes,
        tokenize_symbol,
    ]) {
        const r = f(token, offset);
        if (r !== clvm_1.None) {
            return r;
        }
    }
    return clvm_1.None;
}
exports.tokenize_sexp = tokenize_sexp;
function* token_stream(s) {
    let offset = 0;
    while (offset < s.length) {
        offset = consume_whitespace(s, offset);
        if (offset >= s.length) {
            break;
        }
        const c = s[offset];
        if (/[(.)]/.test(c)) {
            yield clvm_1.t(c, offset);
            offset += 1;
            continue;
        }
        if (/["']/.test(c)) {
            const start = offset;
            const initial_c = s[start];
            offset += 1;
            while (offset < s.length && s[offset] !== initial_c) {
                offset += 1;
            }
            if (offset < s.length) {
                yield clvm_1.t(s.substring(start, offset + 1), start);
                offset += 1;
                continue;
            }
            else {
                throw new SyntaxError(`unterminated string starting at ${start}: ${s.substring(start)}`);
            }
        }
        const [token, end_offset] = consume_until_whitespace(s, offset);
        yield clvm_1.t(token, offset);
        offset = end_offset;
    }
}
exports.token_stream = token_stream;
function read_ir(s, to_sexp = clvm_1.to_sexp_f) {
    const stream = token_stream(s);
    // Fix generator spec incompatibility between python and javascript.
    // Javascript iterator cannot be re-used while python can.
    /*
    for(const [token, offset] of stream){
      return to_sexp(tokenize_sexp(token, offset, stream));
    }
     */
    let retVal;
    const isExecutedOnce = for_of_1.for_of(stream, (value) => {
        const [token, offset] = value;
        retVal = to_sexp(tokenize_sexp(token, offset, stream));
        return "stop";
    });
    if (!isExecutedOnce) {
        throw new SyntaxError("unexpected end of stream");
    }
    return retVal;
}
exports.read_ir = read_ir;
