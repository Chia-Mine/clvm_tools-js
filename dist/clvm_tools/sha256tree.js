"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sha256tree = void 0;
const jscrypto_1 = require("jscrypto");
const clvm_1 = require("clvm");
function sha256tree(v) {
    let s;
    if (clvm_1.isCons(v)) {
        const left = sha256tree(v.pair[0]);
        const right = sha256tree(v.pair[1]);
        s = clvm_1.h("0x02").concat(left).concat(right);
    }
    else {
        s = clvm_1.h("0x01").concat(v.atom);
    }
    const hashedWords = jscrypto_1.SHA256.hash(s.as_word());
    return clvm_1.Bytes.from(hashedWords);
}
exports.sha256tree = sha256tree;