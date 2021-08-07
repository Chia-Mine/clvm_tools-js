import {
  KEYWORD_FROM_ATOM,
  KEYWORD_TO_ATOM,
  int_from_bytes,
  int_to_bytes,
  SExp,
  Bytes,
  Tuple,
  t,
  h,
} from "clvm";
import {read_ir} from "../ir/reader";
import {write_ir} from "../ir/writer";
import {
  ir_as_symbol,
  ir_cons,
  ir_first,
  ir_listp,
  ir_null,
  ir_nullp,
  ir_rest,
  ir_symbol,
  ir_val,
  is_ir,
} from "../ir/utils";
import {Type} from "../ir/Type";

function isPrintable(s: string){
  // eslint-disable-next-line no-control-regex
  const regex = /^[0-9a-zA-Z!"#$%&'()*+,-./:;<=>?@\\[\]^_`{|}~ \t\n\r\x0b\x0c]+$/;
  return regex.test(s);
}

// In order to reduce stack memory consumed, I made `assemble_from_ir` fully flatten from the previous recursive function callstack.
export function assemble_from_ir(ir_sexp: SExp): SExp {
  const input_stack: Array<[number, SExp]> = []; // [depth, SExp]
  const return_value_stack: Array<[number, SExp]> = []; // [depth, SExp]
  let last_return_value: SExp|undefined;
  
  input_stack.push([0, ir_sexp]);
  while(input_stack.length || return_value_stack.length){
    while(return_value_stack.length >= 2){
      if(return_value_stack[return_value_stack.length-1][0] !== return_value_stack[return_value_stack.length-2][0]){
        break;
      }
      const sexp_1 = return_value_stack.pop() as [number, SExp];
      const sexp_2 = return_value_stack.pop() as [number, SExp];
      last_return_value = sexp_1[1].cons(sexp_2[1]);
      return_value_stack.push([sexp_1[0]-1, last_return_value]);
    }
    if(!input_stack.length){
      if(return_value_stack.length === 1){
        break;
      }
      continue;
    }
    
    const depth_and_sexp = (input_stack.pop() as [number, SExp]);
    ir_sexp = depth_and_sexp[1];
    let keyword = ir_as_symbol(ir_sexp);
    if(keyword){
      if(keyword[0] === "#"){
        keyword = keyword.substring(1);
      }
      const atom = KEYWORD_TO_ATOM[keyword as keyof typeof KEYWORD_TO_ATOM];
      if(atom){
        last_return_value = SExp.to(h(atom));
        return_value_stack.push([depth_and_sexp[0], last_return_value]);
        continue;
      }
      else{
        last_return_value = ir_val(ir_sexp);
        return_value_stack.push([depth_and_sexp[0], last_return_value]);
        continue;
      }
      // Original code raises an Error, which never reaches.
      // throw new SyntaxError(`can't parse ${keyrowd} at ${ir_sexp._offset}`);
    }
  
    if(!ir_listp(ir_sexp)){
      last_return_value = ir_val(ir_sexp);
      return_value_stack.push([depth_and_sexp[0], last_return_value]);
      continue;
    }
  
    if(ir_nullp(ir_sexp)){
      last_return_value = SExp.to([]);
      return_value_stack.push([depth_and_sexp[0], last_return_value]);
      continue;
    }
  
    // handle "q"
    const first = ir_first(ir_sexp);
    keyword = ir_as_symbol(first);
    if(keyword === "q"){
      // pass;
    }
  
    const depth = depth_and_sexp[0] + 1;
    input_stack.push([depth, first]);
    input_stack.push([depth, ir_rest(ir_sexp)]);
  }
  
  return last_return_value as SExp;
}

export function type_for_atom(atom: Bytes): number {
  if(atom.length > 2){
    try{
      const v = atom.decode();
      if(isPrintable(v)){
        return Type.QUOTES.i;
      }
    }
    catch (e) {
      // do nothing
    }
    return Type.HEX.i;
  }
  if(int_to_bytes(int_from_bytes(atom)).equal_to(atom)){
    return Type.INT.i;
  }
  return Type.HEX.i;
}

export function disassemble_to_ir<A extends boolean=false>(
  sexp: SExp,
  keyword_from_atom: Record<string, string>,
  allow_keyword?: A,
): A extends false|undefined ? SExp : SExp|Tuple<number, Bytes> {
  if(is_ir(sexp) && allow_keyword !== false){
    return ir_cons(ir_symbol("ir"), sexp);
  }
  
  if(sexp.listp()){
    if(sexp.first().listp() || allow_keyword !== false){
      allow_keyword = true as A;
    }
    const v0 = disassemble_to_ir(sexp.first(), keyword_from_atom, allow_keyword);
    const v1 = disassemble_to_ir(sexp.rest(), keyword_from_atom, false);
    return ir_cons(v0, v1);
  }
  
  const as_atom = sexp.atom as Bytes;
  if(allow_keyword){
    const v = keyword_from_atom[as_atom.hex()];
    if(v && v !== "."){
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      return ir_symbol(v); // @todo Find a good way not to use `ts-ignore`
    }
  }
  
  if(sexp.nullp()){
    return ir_null();
  }
  
  return SExp.to(t(type_for_atom(as_atom), as_atom));
}

export function disassemble(sexp: SExp, keyword_from_atom: Record<string, string> = KEYWORD_FROM_ATOM){
  const symbols = disassemble_to_ir(sexp, keyword_from_atom);
  return write_ir(symbols);
}

export function assemble(s: string){
  const symbols = read_ir(s);
  return assemble_from_ir(symbols);
}