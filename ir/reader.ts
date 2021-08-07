import {to_sexp_f, b, Tuple, t, Optional, None, Bytes, SExp} from "clvm";
import {Type} from "./Type";
import {ir_new, ir_cons} from "./utils";

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

// `tokenize_cons` was incorporated into `tokenize_cons` to reduce stack size by eliminating deep function nest.
/*
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
 */

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

export function tokenize_atom(token: string, offset: number){
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

// In order to reduce stack size used, I fully made it inlined from heavy nested structure which exhausted reserved stack size of js runtime.
export function tokenize_sexp(token: string, offset: number, stream: Generator<Token>){
  if(token === "("){
    ([token, offset] = next_cons_token(stream));
    
    const input_stack: Array<[string, number]> = [];
    const return_value_stack: SExp[] = [];
    const callee_address_stack: number[] = [];
    const env_stack: any[][] = [];
    let last_return_value: SExp|undefined;
    
    input_stack.push([token, offset]);
    while(input_stack.length || callee_address_stack.length){
      let [local_token, local_offset] = [token, offset];
      
      while(callee_address_stack.length && return_value_stack.length){
        const callee_address = callee_address_stack.pop() as number;
        const return_value = return_value_stack.pop() as SExp;
        if(callee_address === 1){
          const env = env_stack.pop() as [SExp, number];
          const rest_sexp = return_value;
          const [first_sexp, initial_offset] = env;
          last_return_value = ir_cons(first_sexp, rest_sexp, initial_offset);
          return_value_stack.push(last_return_value);
        }
        else if(callee_address === 2){
          const env = env_stack.pop() as [number];
          const [initial_offset] = env;
          local_offset = initial_offset;
          const first_sexp = return_value;
          ([local_token, local_offset] = next_cons_token(stream));
  
          let rest_sexp;
          if(local_token === "."){
            const dot_offset = local_offset;
            // grab the last item
            ([local_token, local_offset] = next_cons_token(stream));
            rest_sexp = tokenize_sexp(local_token, local_offset, stream);
            ([local_token, local_offset] = next_cons_token(stream));
            if(local_token !== ")"){
              throw new SyntaxError(`illegal dot expression at ${dot_offset}`);
            }
            last_return_value = ir_cons(first_sexp, rest_sexp, initial_offset);
            return_value_stack.push(last_return_value);
          }
          else{
            callee_address_stack.push(1);
            env_stack.push([first_sexp, initial_offset]);
            input_stack.push([local_token, local_offset]);
          }
        }
      }
      if(!input_stack.length){
        continue;
      }
  
      ([local_token, local_offset] = input_stack.pop() as [string, number]);
      if(local_token === ")"){
        last_return_value = ir_new(Type.NULL.i, 0, local_offset);
        return_value_stack.push(last_return_value);
        continue;
      }
  
      const initial_offset = local_offset;
      if(local_token === "("){
        ([local_token, local_offset] = next_cons_token(stream));
        callee_address_stack.push(2);
        env_stack.push([initial_offset]);
        input_stack.push([local_token, local_offset]);
        continue;
      }
      const first_sexp = tokenize_atom(local_token, local_offset) as SExp;
  
      ([local_token, local_offset] = next_cons_token(stream));
  
      let rest_sexp;
      if(local_token === "."){
        const dot_offset = local_offset;
        // grab the last item
        ([local_token, local_offset] = next_cons_token(stream));
        rest_sexp = tokenize_sexp(local_token, local_offset, stream);
        ([local_token, local_offset] = next_cons_token(stream));
        if(local_token !== ")"){
          throw new SyntaxError(`illegal dot expression at ${dot_offset}`);
        }
        last_return_value = ir_cons(first_sexp, rest_sexp, initial_offset);
        return_value_stack.push(last_return_value);
      }
      else{
        callee_address_stack.push(1);
        env_stack.push([first_sexp, initial_offset]);
        input_stack.push([local_token, local_offset]);
      }
    }
    
    return last_return_value as SExp;
  }
  
  return tokenize_atom(token, offset);
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
