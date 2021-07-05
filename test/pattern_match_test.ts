import {assemble} from "../src/clvm_tools/binutils";
import {match} from "../src/clvm_tools/pattern_match";

test("test_pattern_match", () => {
  let r;
  r = match(assemble("($ . $)"), assemble("$"));
  expect(r).toEqual({});
  
  r = match(assemble("($ . $)"), assemble("x"));
  expect(r).toBeNull();
  
  r = match(assemble("(: . :)"), assemble(":"));
  expect(r).toEqual({});
  
  r = match(assemble("(: . :)"), assemble("x"));
  expect(r).toBeNull();
  
  r = match(assemble("$"), assemble("$"));
  expect(r).toEqual({});
  
  // # () is an atom
  r = match(assemble("($ . n)"), assemble("()"));
  expect(r).toHaveProperty("n");
  expect(r?.n.equal_to(assemble("()"))).toBeTruthy();
  
  r = match(assemble("($ . size)"), assemble("200"));
  expect(r).toHaveProperty("size");
  expect(r?.size.equal_to(assemble("200"))).toBeTruthy();
  
  r = match(assemble("(: . size)"), assemble("200"));
  expect(r).toHaveProperty("size");
  expect(r?.size.equal_to(assemble("200"))).toBeTruthy();
  
  r = match(assemble("($ . size)"), assemble("(I like cheese)"));
  expect(r).toBeNull();
  
  r = match(assemble("(: . size)"), assemble("(I like cheese)"));
  expect(r).toHaveProperty("size");
  expect(r?.size.equal_to(assemble("(I like cheese)"))).toBeTruthy();
  
  r = match(
    assemble("(= (f (r (a))) ($ . pubkey))"), assemble("(= (f (r (a))) 50000)")
  );
  expect(r).toHaveProperty("pubkey");
  expect(r?.pubkey.equal_to(assemble("50000"))).toBeTruthy();
  
  r = match(
    assemble("(= (f (r (a))) ($ . pubkey1) ($ . pubkey2))"),
    assemble("(= (f (r (a))) 50000 60000)"),
  );
  expect(r).toHaveProperty("pubkey1");
  expect(r).toHaveProperty("pubkey2");
  expect(r?.pubkey1.equal_to(assemble("50000"))).toBeTruthy();
  expect(r?.pubkey2.equal_to(assemble("60000"))).toBeTruthy();
  
  r = match(
    assemble("(= (f (r (a))) ($ . pubkey1) ($ . pubkey1))"),
    assemble("(= (f (r (a))) 50000 60000)"),
  );
  expect(r).toBeNull();
  
  const a = assemble("(= (f (r (a))) ($ . pubkey1) ($ . pubkey1))");
  const b = assemble("(= (f (r (a))) 50000 50000)");
  r = match(
    assemble("(= (f (r (a))) ($ . pubkey1) ($ . pubkey1))"),
    assemble("(= (f (r (a))) 50000 50000)"),
  );
  expect(r).toHaveProperty("pubkey1");
  expect(r?.pubkey1.equal_to(assemble("50000"))).toBeTruthy();
});
