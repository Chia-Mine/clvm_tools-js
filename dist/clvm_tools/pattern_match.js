"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.match = exports.unify_bindings = exports.SEXP_MATCH = exports.ATOM_MATCH = void 0;
const clvm_1 = require("clvm");
exports.ATOM_MATCH = clvm_1.b("$");
exports.SEXP_MATCH = clvm_1.b(":");
function unify_bindings(bindings, new_key, new_value) {
    /*
      Try to add a new binding to the list, rejecting it if it conflicts
      with an existing binding.
     */
    const new_key_str = new_key.decode();
    if (new_key_str in bindings) {
        if (bindings[new_key_str] !== new_value) {
            return clvm_1.None;
        }
        return bindings;
    }
    const new_bindings = Object.assign({}, bindings);
    new_bindings[new_key_str] = new_value;
    return new_bindings;
}
exports.unify_bindings = unify_bindings;
function match(pattern, sexp, known_bindings = {}) {
    /*
      Determine if sexp matches the pattern, with the given known bindings already applied.
  
      Returns None if no match, or a (possibly empty) dictionary of bindings if there is a match
  
      Patterns look like this:
  
      ($ . $) matches the literal "$", no bindings (mostly useless)
      (: . :) matches the literal ":", no bindings (mostly useless)
  
      ($ . A) matches B if B is an atom; and A is bound to B
      (: . A) matches B always; and A is bound to B
  
      (A . B) matches (C . D) if A matches C and B matches D
            and bindings are the unification (as long as unification is possible)
     */
    if (!pattern.listp()) {
        if (sexp.listp()) {
            return clvm_1.None;
        }
        return pattern.atom.equal_to(sexp.atom) ? known_bindings : clvm_1.None;
    }
    const left = pattern.first();
    const right = pattern.rest();
    const atom = sexp.atom;
    if (left.equal_to(exports.ATOM_MATCH)) {
        if (sexp.listp()) {
            return clvm_1.None;
        }
        if (right.equal_to(exports.ATOM_MATCH)) {
            if (atom === null || atom === void 0 ? void 0 : atom.equal_to(exports.ATOM_MATCH)) {
                return {};
            }
            return clvm_1.None;
        }
        return unify_bindings(known_bindings, right.atom, sexp);
    }
    if (left.equal_to(exports.SEXP_MATCH)) {
        if (right.equal_to(exports.SEXP_MATCH)) {
            if (atom === null || atom === void 0 ? void 0 : atom.equal_to(exports.SEXP_MATCH)) {
                return {};
            }
            return clvm_1.None;
        }
        return unify_bindings(known_bindings, right.atom, sexp);
    }
    if (!sexp.listp()) {
        return clvm_1.None;
    }
    const new_bindings = match(left, sexp.first(), known_bindings);
    if (new_bindings === clvm_1.None) {
        return new_bindings;
    }
    return match(right, sexp.rest(), new_bindings);
}
exports.match = match;
