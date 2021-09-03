import {h, KEYWORD_TO_ATOM, SExp, Tuple} from "clvm";
import {assemble, disassemble} from "../clvm_tools/binutils";
import {curry, uncurry} from "../clvm_tools/curry";

function check_idempotency(f: SExp, args: SExp){
  const [cost, curried] = curry(f, args);
  
  const r = disassemble(curried);
  const [f_0, args_0] = uncurry(curried) as Tuple<SExp, SExp>;
  
  expect(disassemble(f_0)).toBe(disassemble(f));
  expect(disassemble(args_0)).toBe(disassemble(args));
  return r;
}

test("test_curry_uncurry", () => {
  const PLUS = h(KEYWORD_TO_ATOM["+"]).at(0);
  let f = assemble("(+ 2 5)");
  let args = assemble("(200 30)");
  let actual_disassembly = check_idempotency(f, args);
  expect(actual_disassembly).toBe(`(a (q ${PLUS} 2 5) (c (q . 200) (c (q . 30) 1)))`);
  
  f = assemble("(+ 2 5)");
  args = assemble("((+ (q . 50) (q . 60)))");
  actual_disassembly = check_idempotency(f, args);
  expect(actual_disassembly).toBe(`(a (q ${PLUS} 2 5) (c (q ${PLUS} (q . 50) (q . 60)) 1))`);
});
