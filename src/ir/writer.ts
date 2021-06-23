import {SExp, int_from_bytes, sexp_to_stream, str, Stream, b} from "clvm";
import {Type} from "./Type";
import {
  ir_nullp,
  ir_type,
  ir_listp,
  ir_first,
  ir_rest,
  ir_as_atom,
  ir_val,
} from "./utils";
import {Utf8} from "jscrypto";

export function* iter_sexp_format(ir_sexp: SExp): Generator<str>{
  yield "(";
  let is_first = true;
  while(!ir_nullp(ir_sexp)){
    if(!ir_listp(ir_sexp)){
      yield " . ";
      yield* iter_ir_format(ir_sexp);
      break;
    }
    if(!is_first){
      yield " ";
    }
    for(const _ of iter_ir_format(ir_first(ir_sexp))){
      yield _;
    }
    ir_sexp = ir_rest(ir_sexp);
    is_first = false;
  }
  yield ")";
}

export function* iter_ir_format(ir_sexp: SExp): Generator<str> {
  if(ir_listp(ir_sexp)){
    yield* iter_sexp_format(ir_sexp);
    return;
  }
  
  const type = ir_type(ir_sexp);
  
  if(type === Type.CODE.i){
    const bio = new Stream();
    sexp_to_stream(ir_val(ir_sexp), bio);
    const code = bio.getValue().as_word().toString();
    yield `CODE[${code}]`;
    return;
  }
  
  if(type === Type.NULL.i){
    yield "()";
    return;
  }
  
  const atom = ir_as_atom(ir_sexp);
  
  if(type === Type.INT.i){
    yield `${int_from_bytes(atom)}`;
  }
  else if(type === Type.NODE.i){
    yield `NODE[${int_from_bytes(atom)}]`;
  }
  else if(type === Type.HEX.i){
    yield `0x${atom.hex()}`;
  }
  else if(type === Type.QUOTES.i){
    yield `"${Utf8.stringify(atom.as_word())}"`;
  }
  else if(type === Type.DOUBLE_QUOTE.i){
    yield `"${Utf8.stringify(atom.as_word())}"`;
  }
  else if(type === Type.SINGLE_QUOTE.i){
    yield `'${Utf8.stringify(atom.as_word())}'`;
  }
  else if(type === Type.SYMBOL.i || type === Type.OPERATOR.i){
    try{
      yield Utf8.stringify(atom.as_word());
    }
    catch(e){
      yield `(indecipherable symbol: ${atom.hex()})`;
    }
  }
  else{
    throw new SyntaxError(`bad ir format: ${ir_sexp}`);
  }
}

export function write_ir_to_stream(ir_sexp: SExp, f: Stream){
  for(const _ of iter_ir_format(ir_sexp)){
    f.write(b(_));
  }
}

export function write_ir(ir_sexp: SExp): str {
  const s = new Stream();
  write_ir_to_stream(ir_sexp, s);
  return Utf8.stringify(s.getValue().as_word());
}
