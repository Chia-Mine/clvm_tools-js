import {Atom, Bytes, None, SExp, str} from "clvm";
import {Utf8} from "jscrypto";

export const ATOM_MATCH = Bytes.from("$");
export const SEXP_MATCH = Bytes.from(":");

export function unify_bindings(bindings: Record<str, SExp>, new_key: Bytes, new_value: SExp){
  /*
    Try to add a new binding to the list, rejecting it if it conflicts
    with an existing binding.
   */
  const new_key_str = Utf8.stringify(new_key.as_word());
  if(new_key_str in bindings){
    if(bindings[new_key_str] !== new_value){
      return None;
    }
    return bindings;
  }
  const new_bindings = {...bindings};
  new_bindings[new_key_str] = new_value;
  return new_bindings;
}

export function match(pattern: SExp, sexp: SExp, known_bindings: Record<str, SExp> = {}): Record<str, SExp>|None {
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
  
  if(!pattern.listp()){
    if(sexp.listp()){
      return None;
    }
    return (pattern as Atom).atom.equal_to((sexp as Atom).atom) ? known_bindings : None;
  }
  
  const left = pattern.first();
  const right = pattern.rest();
  const atom = sexp.atom;
  
  if(left.equal_to(ATOM_MATCH)){
    if(sexp.listp()){
      return None;
    }
    if(right.equal_to(ATOM_MATCH)){
      if(atom?.equal_to(ATOM_MATCH)){
        return {};
      }
      return None;
    }
    return unify_bindings(known_bindings, right.atom as Bytes, sexp);
  }
  
  if(left.equal_to(SEXP_MATCH)){
    if(right.equal_to(SEXP_MATCH)){
      if(atom?.equal_to(SEXP_MATCH)){
        return {};
      }
      return None;
    }
    return unify_bindings(known_bindings, right.atom as Bytes, sexp);
  }
  
  if(!sexp.listp()){
    return None;
  }
  
  const new_bindings = match(left, sexp.first(), known_bindings);
  if(new_bindings === None){
    return new_bindings;
  }
  return match(right, sexp.rest(), new_bindings);
}
