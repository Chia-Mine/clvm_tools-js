import {SExp, int_from_bytes, sexp_to_stream, Stream, b} from "clvm";
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
import {printError} from "../platform/print";

export function* iter_sexp_format(ir_sexp: SExp): Generator<string>{
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

export function* iter_ir_format(ir_sexp: SExp): Generator<string> {
  if(ir_listp(ir_sexp)){
    yield* iter_sexp_format(ir_sexp);
    return;
  }
  
  const type = ir_type(ir_sexp);
  
  if(type === Type.CODE.i){
    const bio = new Stream();
    sexp_to_stream(ir_val(ir_sexp), bio);
    const code = bio.getValue().hex();
    yield `CODE[${code}]`;
    return;
  }
  
  if(type === Type.NULL.i){
    yield "()";
    return;
  }
  
  const atom = ir_as_atom(ir_sexp);
  
  if(type === Type.INT.i){
    yield `${int_from_bytes(atom, {signed: true})}`;
  }
  else if(type === Type.NODE.i){
    yield `NODE[${int_from_bytes(atom, {signed: true})}]`;
  }
  else if(type === Type.HEX.i){
    yield `0x${atom.hex()}`;
  }
  else if(type === Type.QUOTES.i){
    yield `"${atom.decode()}"`;
  }
  else if(type === Type.DOUBLE_QUOTE.i){
    yield `"${atom.decode()}"`;
  }
  else if(type === Type.SINGLE_QUOTE.i){
    yield `'${atom.decode()}'`;
  }
  else if(type === Type.SYMBOL.i || type === Type.OPERATOR.i){
    try{
      yield atom.decode();
    }
    catch(e){
      yield `(indecipherable symbol: ${atom.hex()})`;
    }
  }
  else{
    const errMsg = `bad ir format: ${ir_sexp}`;
    printError(`SyntaxError: ${errMsg}`);
    throw new SyntaxError(errMsg);
  }
}

export function write_ir_to_stream(ir_sexp: SExp, f: Stream){
  for(const _ of iter_ir_format(ir_sexp)){
    f.write(b(_));
  }
}

export function write_ir(ir_sexp: SExp): string {
  const s = new Stream();
  write_ir_to_stream(ir_sexp, s);
  return s.getValue().decode();
}
