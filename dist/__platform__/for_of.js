"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.for_of = void 0;
function for_of(iterator, lambda) {
    let i = 0;
    let next;
    while ((next = iterator.next()) && !next.done) {
        const op = lambda(next.value, i);
        if (op === "stop") {
            return true;
        }
        i++;
    }
    // Returns true if at least loop is executed once.
    return Boolean(i);
}
exports.for_of = for_of;
