import {to_sexp_f, b, int, str, Tuple, t, Optional, None, Bytes, SExp} from "clvm";
import {Type} from "./Type";
import {ir_new, ir_cons} from "./utils";

export type Token = Tuple<str, int>;
export type Stream = Generator<Token>;

export function consume_whitespace(s: str, offset: int): int {
  // This also deals with comments
  while(true){
    while(offset < s.length && /[ ]/.test(s[offset])){
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

export function consume_until_whitespace(s: str, offset: int): Token {
  const start = offset;
  while(offset < s.length && !/[ ]/.test(s[offset]) && s[offset] !== ")"){
    offset += 1;
  }
  return t(s.substring(start, offset), offset);
}

export function next_cons_token(stream: Stream): Token {
  let found = false;
  let token: str = "";
  let offset: int = -1;
  
  for(const s of stream){
    found = true;
    ([token, offset] = s);
    break;
  }
  if(!found){
    throw new SyntaxError("missing )");
  }
  
  return t(token, offset);
}

export function tokenize_cons(token: str, offset: int, stream: Stream): SExp {
  if(token === ")"){
    return ir_new(Type.NULL.i, 0, offset);
  }
  
  const initial_offset = offset;
  const first_sexp = tokenize_sexp(token, offset, stream);
  
  let rest_sexp;
  
  ([token, offset] = next_cons_token(stream));
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

export function tokenize_int(token: str, offset: int): Optional<SExp> {
  try{
    const nToken = +token;
    if(isNaN(nToken) || !isFinite(nToken)){
      return None;
    }
    
    return ir_new(Type.INT.i, nToken, offset);
  }
  catch (e){ }
  return None;
}

export function tokenize_hex(token: str, offset: int): Optional<SExp> {
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

export function tokenize_quotes(token: str, offset: int){
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

export function tokenize_symbol(token: str, offset: int){
  return t(t(Type.SYMBOL.i, offset), b(token));
}

export function tokenize_sexp(token: str, offset: int, stream: Stream){
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

export function* token_stream(s: str): Generator<Token> {
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

export function read_ir(s: str, to_sexp: typeof to_sexp_f = to_sexp_f){
  const stream = token_stream(s);
  
  for(const [token, offset] of stream){
    return to_sexp(tokenize_sexp(token, offset, stream));
  }
  throw new SyntaxError("unexpected end of stream");
}
