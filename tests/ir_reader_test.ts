import * as reader from "../ir/reader";

describe("test_reader_1", () => {
  test("(100 0x0100)", () => {
    const sexp = reader.read_ir("(100 0x0100)");
    expect(sexp.toString()).toBe("ffff84434f4e5301ffffff83494e540164ffff84434f4e5305ffffff8348455805820100ffff844e554c4c0b80");
  });
  
  test("100", () => {
    const sexp = reader.read_ir("100");
    expect(sexp.toString()).toBe("ffff83494e548064");
  });
  
  test("0x0100", () => {
    const sexp = reader.read_ir("0x0100");
    expect(sexp.toString()).toBe("ffff8348455880820100");
  });
  
  test("0x100", () => {
    const sexp = reader.read_ir("0x100");
    expect(sexp.toString()).toBe("ffff8348455880820100");
  });
  
  test('"100"', () => {
    const sexp = reader.read_ir('"100"');
    expect(sexp.toString()).toBe("ffff834451548083313030");
  });
  
  test("foo", () => {
    const sexp = reader.read_ir("foo");
    expect(sexp.toString()).toBe("ffff8353594d8083666f6f");
  });
  
  test('(c (quote 100) (c (quote "foo") (quote ())))', () => {
    const sexp = reader.read_ir('(c (quote 100) (c (quote "foo") (quote ())))');
    expect(sexp.toString()).toBe("ffff84434f4e5301ffffff8353594d0163ffff84434f4e5303ffffff84434f4e5304ffffff8353594d048571756f7465ffff84434f4e530affffff83494e540a64ffff844e554c4c0d80ffff84434f4e530fffffff84434f4e5310ffffff8353594d1063ffff84434f4e5312ffffff84434f4e5313ffffff8353594d138571756f7465ffff84434f4e5319ffffff834451541983666f6fffff844e554c4c1e80ffff84434f4e5320ffffff84434f4e5321ffffff8353594d218571756f7465ffff84434f4e5327ffffff844e554c4c2880ffff844e554c4c2980ffff844e554c4c2a80ffff844e554c4c2b80");
  });
  
  test("(c . foo)", () => {
    const sexp = reader.read_ir("(c . foo)");
    expect(sexp.toString()).toBe("ffff84434f4e5301ffffff8353594d0163ffff8353594d0583666f6f");
  });
});
