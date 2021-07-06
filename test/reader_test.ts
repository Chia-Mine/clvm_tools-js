import {read_ir} from "../src/ir/reader";
import {write_ir} from "../src/ir/writer";

test("test_tokenize_comments", () => {
  const script_source = "(equal 7 (+ 5 ;foo bar\n   2))";
  const expected_output = "(equal 7 (+ 5 2))";
  const t = read_ir(script_source);
  const s = write_ir(t);
  
  expect(s).toBe(expected_output);
});
