/*
These tests check that the `clvmc` utility methods
continue to work with the `include` keyword, and produce
the expected output. It's not intended to be a complete
test of the compiler, just the `clvmc` api.
 */
import * as path from "path";
import * as fs from "fs";
import * as tmp from "tmp";
import * as clvmc from "../src/clvm_tools/clvmc";

const INCLUDE_CODE = "((defconstant FOO 6001))"
const MAIN_CODE = `(mod (VALUE) (include "include.clvm") (+ VALUE FOO))`
const EXPECTED_HEX_OUTPUT = "ff10ff02ffff0182177180"

// # `EXPECTED_HEX_OUTPUT` disassembles to "(+ 2 (q . 6001))"


test("test_compile_clvm_text", (done) => {
  tmp.dir({unsafeCleanup: true}, function tempFileCreated(err, include_dir, cleanupCallback){
    try{
      if(err){
        return done(err);
      }
      const include_path = path.resolve(include_dir, "include.clvm");
      fs.writeFileSync(include_path, INCLUDE_CODE);
      const output = clvmc.compile_clvm_text(MAIN_CODE, [include_dir]);
  
      expect(output.toString()).toBe(EXPECTED_HEX_OUTPUT);
      done();
    }
    catch(e){
      done(e);
    }
    finally {
      cleanupCallback();
    }
  });
});
