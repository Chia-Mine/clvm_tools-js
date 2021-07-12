import {to_sexp_f, b, sexp_from_stream, Stream, CastableType, Bytes, t, None} from "clvm";

const TEXT = b("the quick brown fox jumps over the lazy dogs");

function check_serde(s: CastableType){
  const v = to_sexp_f(s);
  let b = v.as_bin();
  let v1 = sexp_from_stream(new Stream(b), to_sexp_f);
  if(!v.equal_to(v1)){
    console.log(`${v}: ${b.length} ${b} ${v1}`);
    // debugger;
    b = v.as_bin();
    v1 = sexp_from_stream(new Stream(b), to_sexp_f);
  }
  expect(v.equal_to(v1)).toBeTruthy();
}

test("test_empty_string", () => {
  check_serde(b(""));
});

test("test_single_bytes", () => {
  for(let i=0;i<256;i++){
    check_serde(Bytes.from([i]));
  }
});

test("test_short_lists", () => {
  check_serde([]);
  for(let _=0;_<2048;_+=8){
    for(let size=1;size<5;size++){
      check_serde([...new Array(size)].map(() => _));
    }
  }
});

test("test_cons_box", () => {
  check_serde(t(None, None));
  check_serde(t(None, [1, 2, 30, 40, 600, t(None, 18)]));
  check_serde(t(100, t(TEXT, t(30, t(50, t(90, t(TEXT, TEXT.concat(TEXT))))))));
});

test("test_long_blobs", () => {
  let text = new Bytes();
  for(let i=0;i<300;i++) text = text.concat(TEXT);
  
  for(let _=0;_<text.length;_++){
    const t1 = text.slice(0, _);
    check_serde(t1);
  }
});

test("test_very_long_blobs", () => {
  // Skip 0x100000, 0x8000000 for they take too much time for test
  for(let size of [0x40, 0x2000/*, 0x100000, 0x8000000*/]){
    const count = Math.floor(size / TEXT.length);
    let text = new Bytes();
    for(let i=0;i<count;i++) text = text.concat(TEXT);
    expect(text.length).toBeLessThan(size);
    check_serde(text);
  
    for(let i=0;i<count+1;i++) text = text.concat(TEXT);
    expect(text.length).toBeGreaterThan(size);
    check_serde(text);
  }
});
