import * as reader from "../ir/reader";
import * as writer from "../ir/writer";

function do_test(sexp_text: string){
  const ir_sexp = reader.read_ir(sexp_text);
  const sexp_text_normalized = writer.write_ir(ir_sexp);
  const ir_sexp_2 = reader.read_ir(sexp_text);
  const sexp_text_normalized_2 = writer.write_ir(ir_sexp_2);
  expect(sexp_text_normalized).toEqual(sexp_text_normalized_2);
}

describe("test_writer_1", () => {
  test("100", () => do_test("100"));
  
  test("0x0100", () => do_test("0x0100"));
  
  test("0x100", () => do_test("0x100"));
  
  test('"100"', () => do_test('"100"'));
  
  test('"the quick brown fox jumps over the lazy dogs"', () => do_test('"the quick brown fox jumps over the lazy dogs"'));
  
  test("(the quick brown fox jumps over the lazy dogs)", () => do_test("(the quick brown fox jumps over the lazy dogs)"));
  
  test("foo", () => do_test("foo"));
  
  test("(100 0x0100)", () => do_test("(100 0x0100)"));
  
  test('(c (quote 100) (c (quote "foo") (quote ())))', () => do_test('(c (quote 100) (c (quote "foo") (quote ())))'));
  
  test("(c . foo)", () => do_test("(c . foo)"));
  
  test("(a b c de f g h i . j)", () => do_test("(a b c de f g h i . j)"));
});
