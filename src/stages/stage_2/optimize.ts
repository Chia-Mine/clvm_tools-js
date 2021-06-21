import {Bytes, KEYWORD_TO_ATOM, None, SExp, t} from "clvm";
import {match} from "../../clvm_tools/pattern_match";
import {assemble} from "../../clvm_tools/binutils";
import {NodePath, LEFT, RIGHT} from "../../clvm_tools/NodePath";
import {quote} from "./helpers";
import {TRunProgram} from "../stage_0";

export const QUOTE_ATOM = KEYWORD_TO_ATOM["q"];
export const APPLY_ATOM = KEYWORD_TO_ATOM["a"];
export const FIRST_ATOM = KEYWORD_TO_ATOM["f"];
export const REST_ATOM = KEYWORD_TO_ATOM["r"];
export const CONS_ATOM = KEYWORD_TO_ATOM["c"];
export const RAISE_ATOM = KEYWORD_TO_ATOM["x"];

const DEBUG_OPTIMIZATIONS = 0;

export function non_nil(sexp: SExp){
  return sexp.listp() || (sexp.atom && sexp.atom.length > 0);
}

export function seems_constant(sexp: SExp){
  if(!sexp.listp()){
    // note that `0` is a constant
    return !non_nil(sexp);
  }
  
  const operator = sexp.first();
  if(!operator.listp()){
    const atom = operator.atom && operator.atom.toString();
    if(atom === QUOTE_ATOM){
      return true;
    }
    else if(atom === RAISE_ATOM){
      return false;
    }
  }
  else if(!seems_constant(operator)){
    return false;
  }
  
  for(const _ of sexp.rest().as_iter()){
    if(!seems_constant(_)){
      return false;
    }
  }
  
  return true;
}

export function constant_optimizer(r: SExp, eval_f: TRunProgram){
  /*
    If the expression does not depend upon @ anywhere,
    it's a constant. So we can simply evaluate it and
    return the quoted result.
   */
  if(seems_constant(r) && non_nil(r)){
    const [, r1] = eval_f(r, SExp.null());
    r = SExp.to(quote(r1));
  }
  return r;
}

export function is_args_call(r: SExp){
  return !r.listp() && r.as_int() === 1;
}

export const CONS_Q_A_OPTIMIZER_PATTERN = assemble("(a (q . (: . sexp)) (: . args))");

export function cons_q_a_optimizer(r: SExp, eval_f: TRunProgram){
  /*
    This applies the transform
    (a (q . SEXP) @) => SEXP
   */
  const t1 = match(CONS_Q_A_OPTIMIZER_PATTERN, r);
  if(t1 && is_args_call(t1["args"])){
    return t1["sexp"];
  }
  return r;
}

export const CONS_PATTERN = assemble("(c (: . first) (: . rest)))");

export function cons_f(args: SExp){
  const t = match(CONS_PATTERN, args);
  if(t){
    return t["first"];
  }
  return SExp.to([FIRST_ATOM, args]);
}

export function cons_r(args: SExp){
  const t = match(CONS_PATTERN, args);
  if(t){
    return t["rest"];
  }
  return SExp.to([REST_ATOM, args]);
}

export function path_from_args(sexp: SExp, new_args: SExp): SExp {
  const v = sexp.as_int();
  if(v <= 1){
    return new_args;
  }
  sexp = SExp.to(v >> 1);
  if(v & 1){
    return path_from_args(sexp, cons_r(new_args));
  }
  return path_from_args(sexp, cons_f(new_args));
}

export function sub_args(sexp: SExp, new_args: SExp): SExp {
  if(sexp.nullp() || !sexp.listp()){
    return path_from_args(sexp, new_args);
  }
  
  let first = sexp.first();
  if(first.listp()){
    first = sub_args(first, new_args);
  }
  else{
    const op = first.atom as Bytes;
    if(op.toString() === QUOTE_ATOM){
      return sexp;
    }
  }
  
  const args = [first];
  for(const _ of sexp.rest().as_iter()){
    args.push(sub_args(_, new_args));
  }
  
  return SExp.to(args);
}

export const VAR_CHANGE_OPTIMIZER_CONS_EVAL_PATTERN = assemble("(a (q . (: . sexp)) (: . args))");

export function var_change_optimizer_cons_eval(r: SExp, eval_f: TRunProgram){
  /*
    This applies the transform
    (a (q . (op SEXP1...)) (ARGS)) => (q . RET_VAL) where ARGS != @
    via
    (op (a SEXP1 (ARGS)) ...) (ARGS)) and then "children_optimizer" of this.
    In some cases, this can result in a constant in some of the children.

    If we end up needing to push the "change of variables" to only one child, keep
    the optimization. Otherwise discard it.
   */
  
  const t1 = match(VAR_CHANGE_OPTIMIZER_CONS_EVAL_PATTERN, r);
  
  if(t1 === None){
    return r;
  }
  
  const original_args = t1["args"];
  const original_call = t1["sexp"];
  
  const new_eval_sexp_args = sub_args(original_call, original_args);
  
  // Do not iterate into a quoted value as if it were a list
  if(seems_constant(new_eval_sexp_args)){
    const opt_operands = optimize_sexp(new_eval_sexp_args, eval_f);
    return SExp.to(opt_operands);
  }
  
  const new_operands: SExp[] = [];
  for(const item of new_eval_sexp_args.as_iter()){
    new_operands.push(item);
  }
  const opt_operands: SExp[] = new_operands.map(_ => optimize_sexp(_, eval_f));
  const non_constant_count = opt_operands.reduce((acc, val) => {
    return acc + (val.listp() && val.first().toString() !== QUOTE_ATOM ? 1 : 0);
  }, 0);
  if(non_constant_count < 1){
    return SExp.to(opt_operands);
  }
  return r;
}

export function children_optimizer(r: SExp, eval_f: TRunProgram){
  // Recursively apply optimizations to all non-quoted child nodes.
  if(!r.listp()){
    return r;
  }
  const operator = r.first();
  if(!operator.listp()){
    const op = operator.atom as Bytes;
    if(op.toString() === QUOTE_ATOM){
      return r;
    }
  }
  const optimized: SExp[] = [];
  for(const _ of r.as_iter()){
    optimized.push(optimize_sexp(_, eval_f));
  }
  return SExp.to(optimized);
}

export const CONS_OPTIMIZER_PATTERN_FIRST = assemble("(f (c (: . first) (: . rest)))")
export const CONS_OPTIMIZER_PATTERN_REST = assemble("(r (c (: . first) (: . rest)))")

export function cons_optimizer(r: SExp, eval_f: TRunProgram){
  /*
    This applies the transform
    (f (c A B)) => A
    and
    (r (c A B)) => B
   */
  let t1 = match(CONS_OPTIMIZER_PATTERN_FIRST, r);
  if(t1){
    return t1["first"];
  }
  t1 = match(CONS_OPTIMIZER_PATTERN_REST, r);
  if(t1){
    return t1["rest"];
  }
  return r;
}

export const FIRST_ATOM_PATTERN = assemble("(f ($ . atom))")
export const REST_ATOM_PATTERN = assemble("(r ($ . atom))")

export function path_optimizer(r: SExp, eval_f: TRunProgram){
  /*
    This applies the transform
    (f N) => A
    and
    (r N) => B
   */
  let t1 = match(FIRST_ATOM_PATTERN, r);
  if(t1 && non_nil(t1["atom"])){
    let node = new NodePath(t1["atom"].as_int());
    node = node.add(LEFT);
    return SExp.to(node.as_short_path());
  }
  
  t1 = match(REST_ATOM_PATTERN, r);
  if(t1 && non_nil(t1["atom"])){
    let node = new NodePath(t1["atom"].as_int());
    node = node.add(RIGHT);
    return SExp.to(node.as_short_path());
  }
  return r;
}

export const QUOTE_PATTERN_1 = assemble("(q . 0)");

export function quote_null_optimizer(r: SExp, eval_f: TRunProgram){
  // This applies the transform `(q . 0)` => `0`
  const t1 = match(QUOTE_PATTERN_1, r);
  if(t1){
    return SExp.to(0);
  }
  return r;
}

export const APPLY_NULL_PATTERN_1 = assemble("(a 0 . (: . rest))");

export function apply_null_optimizer(r: SExp, eval_f: TRunProgram){
  // This applies the transform `(a 0 ARGS)` => `0`
  const t1 = match(APPLY_NULL_PATTERN_1, r);
  if(t1){
    return SExp.to(0);
  }
  return r;
}

export function optimize_sexp(r: SExp, eval_f: TRunProgram): SExp {
  /*
    Optimize an s-expression R written for clvm to R_opt where
    (a R args) == (a R_opt args) for ANY args.
   */
  if(r.nullp() || !r.listp()){
    return r;
  }
  
  const OPTIMIZERS = [
    constant_optimizer,
    constant_optimizer,
    cons_q_a_optimizer,
    var_change_optimizer_cons_eval,
    children_optimizer,
    path_optimizer,
    quote_null_optimizer,
    apply_null_optimizer,
  ];
  
  while(r.listp()){
    const start_r = r;
    let opt: typeof OPTIMIZERS extends Array<infer T> ? T : never = OPTIMIZERS[0];
    for(opt of OPTIMIZERS){
      r = opt(r, eval_f);
      if(!start_r.equal_to(r)){
        break;
      }
    }
    if(start_r.equal_to(r)){
      return r;
    }
    if(DEBUG_OPTIMIZATIONS){
      console.log(`OPT-${opt.name}[${start_r}] => ${r}`);
    }
  }
  
  return r;
}

export function make_do_opt(run_program: TRunProgram){
  return function do_opt(args: SExp){
    return t(1, optimize_sexp(args.first(), run_program));
  };
}
