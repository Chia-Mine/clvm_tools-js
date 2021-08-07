import {to_sexp_f, b, Tuple, t, Optional, None, Bytes, SExp} from "clvm";
import {Type} from "./Type";
import {ir_new, ir_cons} from "./utils";
import {for_of} from "../platform/for_of";

export type Token = Tuple<string, number>;

export function consume_whitespace(s: string, offset: number): number {
  // This also deals with comments
  // eslint-disable-next-line no-constant-condition
  while(true){
    while(offset < s.length && /\s+/.test(s[offset])){
      offset += 1;
    }
    if(offset >= s.length || s[offset] !== ";"){
      break;
    }
    while(offset < s.length && !/[\n\r]/.test(s[offset])){
      offset += 1;
    }
  }
  return offset;
}

export function consume_until_whitespace(s: string, offset: number): Token {
  const start = offset;
  while(offset < s.length && !/\s+/.test(s[offset]) && s[offset] !== ")"){
    offset += 1;
  }
  return t(s.substring(start, offset), offset);
}

export function next_cons_token(stream: Generator<Token>): Token {
  let token: string = "";
  let offset: number = -1;
  
  // Fix generator spec incompatibility between python and javascript.
  // Javascript iterator cannot be re-used while python can.
  /*
  for(const s of stream){
    found = true;
    ([token, offset] = s);
    break;
  }
   */
  const next = stream.next();
  if(next.done){
    throw new SyntaxError("missing )");
  }
  ([token, offset] = next.value);
  
  return t(token, offset);
}

export function tokenize_cons(token: string, offset: number, stream: Generator<Token>): SExp {
  if(token === ")"){
    return ir_new(Type.NULL.i, 0, offset);
  }
  
  const initial_offset = offset;
  const first_sexp = tokenize_sexp(token, offset, stream);
  
  ([token, offset] = next_cons_token(stream));
  
  let rest_sexp;
  if(token === "."){
    const dot_offset = offset;
    // grab the last item
    ([token, offset] = next_cons_token(stream));
    rest_sexp = tokenize_sexp(token, offset, stream);
    ([token, offset] = next_cons_token(stream));
    if(token !== ")"){
      throw new SyntaxError(`illegal dot expression at ${dot_offset}`);
    }
  }
  else{
    rest_sexp = tokenize_cons(token, offset, stream);
  }
  return ir_cons(first_sexp, rest_sexp, initial_offset);
}

export function tokenize_int(token: string, offset: number): Optional<SExp> {
  try{
    // Don't recognize hex string to int
    if(token.slice(0, 2).toUpperCase() === "0X"){
      return None;
    }
    const nToken = +token;
    if(isNaN(nToken) || !isFinite(nToken)){
      return None;
    }
    
    return ir_new(Type.INT.i, nToken, offset);
  }
  catch (e){
    // Skip
  }
  return None;
}

export function tokenize_hex(token: string, offset: number): Optional<SExp> {
  if(token.slice(0, 2).toUpperCase() === "0X"){
    try{
      token = token.substring(2);
      if(token.length % 2 === 1){
        token = `0${token}`;
      }
      return ir_new(Type.HEX.i, Bytes.from(token, "hex"), offset);
    }
    catch(e){
      throw new SyntaxError(`invalid hex at ${offset}: 0x${token}`);
    }
  }
  return None;
}

export function tokenize_quotes(token: string, offset: number){
  if(token.length < 2){
    return None;
  }
  const c = token[0];
  if(!/['"]/.test(c)){
    return None;
  }
  
  if(token[token.length-1] !== c){
    throw new SyntaxError(`unterminated string starting at ${offset}: ${token}`);
  }
  
  const q_type = c === "'" ? Type.SINGLE_QUOTE : Type.DOUBLE_QUOTE;
  return t(t(q_type.i, offset), b(token.substring(1, token.length-1)));
}

export function tokenize_symbol(token: string, offset: number){
  return t(t(Type.SYMBOL.i, offset), b(token));
}

export function tokenize_sexp(token: string, offset: number, stream: Generator<Token>){
  if(token === "("){
    const [token, offset] = next_cons_token(stream);
    return tokenize_cons(token, offset, stream);
  }
  
  for(const f of [
    tokenize_int,
    tokenize_hex,
    tokenize_quotes,
    tokenize_symbol,
  ]){
    const r = f(token, offset);
    if(r !== None){
      return r;
    }
  }
  
  return None;
}

export function* token_stream(s: string): Generator<Token> {
  let offset = 0;
  while(offset < s.length){
    offset = consume_whitespace(s, offset);
    if(offset >= s.length){
      break;
    }
    const c = s[offset];
    if(/[(.)]/.test(c)){
      yield t(c, offset);
      offset += 1;
      continue;
    }
    if(/["']/.test(c)){
      const start = offset;
      const initial_c = s[start];
      offset += 1;
      while(offset < s.length && s[offset] !== initial_c){
        offset += 1;
      }
      if(offset < s.length){
        yield t(s.substring(start, offset+1), start);
        offset += 1;
        continue;
      }
      else{
        throw new SyntaxError(`unterminated string starting at ${start}: ${s.substring(start)}`);
      }
    }
    const [token, end_offset] = consume_until_whitespace(s, offset);
    yield t(token, offset);
    offset = end_offset;
  }
}

export function read_ir(s: string, to_sexp: typeof to_sexp_f = to_sexp_f): SExp {
  const stream = token_stream(s);
  
  // Fix generator spec incompatibility between python and javascript.
  // Javascript iterator cannot be re-used while python can.
  /*
  for(const [token, offset] of stream){
    return to_sexp(tokenize_sexp(token, offset, stream));
  }
   */
  const next = stream.next();
  if(next.done){
    throw new SyntaxError("unexpected end of stream");
  }
  const [token, offset] = next.value;
  return to_sexp(tokenize_sexp(token, offset, stream));
}
