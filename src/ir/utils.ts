import {
  SExp,
  int_from_bytes,
  CastableType,
  int,
  t,
  Bytes,
  bool,
  str,
  Tuple,
  Optional,
  None,
  isCons
} from "clvm";
import {Type, CONS_TYPES} from "./Type";
import {Utf8} from "jscrypto";

export function ir_new(type: SExp|int|Tuple<any, any>|None, val: CastableType, offset?: int): SExp {
  const type_and_offset = typeof offset === "number" ? SExp.to(t(type, offset)) : type;
  return SExp.to(t(type_and_offset, val));
}

export function ir_cons(first: SExp|Tuple<any, any>|None, rest: SExp|Tuple<any, any>|None, offset?: int): SExp {
  return ir_new(Type.CONS.i, ir_new(first, rest), offset);
}

export function ir_list(...items: SExp[]): SExp {
  if(items && items.length){
    return ir_cons(items[0], ir_list(...items.slice(1)));
  }
  return ir_null();
}

export function ir_null(): SExp {
  return ir_new(Type.NULL.i, 0);
}

export function ir_type(ir_sexp: SExp): int {
  let the_type = ir_sexp.first();
  if(the_type.listp()){
    the_type = the_type.first();
  }
  
  return int_from_bytes(the_type.atom);
}

export function ir_as_int(ir_sexp: SExp): int {
  return int_from_bytes(ir_as_atom(ir_sexp));
}

export function ir_offset(ir_sexp: SExp): int {
  let val = ir_sexp.first();
  let the_offset;
  if(val.listp()){
    the_offset = val.rest().atom;
  }
  else{
    the_offset = Bytes.from("0xff", "hex");
  }
  return int_from_bytes(the_offset);
}

export function ir_val(ir_sexp: SExp): SExp {
  return ir_sexp.rest();
}

export function ir_nullp(ir_sexp: SExp): bool {
  return ir_type(ir_sexp) === Type.NULL.i;
}

export function ir_listp(ir_sexp: SExp): bool {
  return CONS_TYPES.includes(ir_type(ir_sexp));
}

export function ir_as_sexp(ir_sexp: SExp): SExp {
  if(ir_nullp(ir_sexp)){
    return SExp.null(); // @todo Check this is correct. Original source returns empty list `[]`.
  }
  else if(ir_type(ir_sexp) === Type.CONS.i){
    return ir_as_sexp(ir_first(ir_sexp)).cons(ir_as_sexp(ir_rest(ir_sexp)));
  }
  return ir_sexp.rest();
}

export function ir_is_atom(ir_sexp: SExp): bool {
  return !ir_listp(ir_sexp);
}

export function ir_as_atom(ir_sexp: SExp): Bytes {
  return Bytes.from(ir_sexp.rest().atom);
}

export function ir_first(ir_sexp: SExp): SExp {
  return ir_sexp.rest().first();
}

export function ir_rest(ir_sexp: SExp): SExp {
  return ir_sexp.rest().rest();
}

export function ir_symbol(symbol: str): Tuple<int, Bytes> {
  return t(Type.SYMBOL.i, Bytes.from(symbol, "utf8"));
}

export function ir_as_symbol(ir_sexp: SExp): Optional<str> {
  if(ir_sexp.listp() && ir_type(ir_sexp) === Type.SYMBOL.i){
    const b = Bytes.from(ir_as_sexp(ir_sexp).atom);
    return Utf8.stringify(b.as_word());
  }
  return None;
}

export function* ir_iter(ir_sexp: SExp){
  while(ir_listp(ir_sexp)){
    yield ir_first(ir_sexp);
    ir_sexp = ir_rest(ir_sexp);
  }
}

export function is_ir(sexp: SExp): bool {
  if(!isCons(sexp)){
    return false;
  }
  
  const [type_sexp, val_sexp] = sexp.pair;
  const f = type_sexp.atom;
  if(f === None || f.length > 1){
    return false;
  }
  
  const the_type = int_from_bytes(f);
  let t;
  try{
    t = new Type(the_type);
  }
  catch (e){
    return false;
  }
  
  if(t.is(Type.CONS)){
    if(val_sexp.atom.equal_to(Bytes.NULL)){
      return true;
    }
    if(val_sexp.pair){
      return val_sexp.every((_: SExp) => is_ir(_));
    }
    return false;
  }
  
  return val_sexp.atom !== None;
}
