import {int_from_bytes} from "clvm";
import {
  NodePath,
  TOP,
  LEFT,
  RIGHT,
} from "../src/clvm_tools/NodePath";

const LEFT_RIGHT_LEFT = LEFT.add(RIGHT).add(LEFT);

const reset = (n: NodePath) => {
  const path_blob = n.as_short_path();
  const index = int_from_bytes(path_blob);
  return new NodePath(index);
};

const cmp_to_bits = (n: NodePath, bits: string) => {
  const n_as_int = parseInt(`${n.as_short_path().hex()}`, 16);
  const bits_as_int = parseInt(`${bits}`, 2);
  expect(n_as_int).toBe(bits_as_int);
};

test("test_node_path", () => {
  let n = TOP;
  expect(n.as_short_path().hex()).toBe("01");
  n = reset(n);
  n = n.add(LEFT);
  expect(n.as_short_path().hex()).toBe("02");
  n = reset(n);
  n = n.add(RIGHT);
  expect(n.as_short_path().hex()).toBe("06");
  n = reset(n);
  n = n.add(RIGHT);
  expect(n.as_short_path().hex()).toBe("0e");
  n = reset(n);
  n = n.add(LEFT);
  expect(n.as_short_path().hex()).toBe("16");
  n = reset(n);
  n = n.add(LEFT);
  expect(n.as_short_path().hex()).toBe("26");
  n = reset(n);
  n = n.add(LEFT);
  expect(n.as_short_path().hex()).toBe("46");
  n = reset(n);
  n = n.add(RIGHT);
  expect(n.as_short_path().hex()).toBe("c6");
  n = reset(n);
  n = n.add(LEFT);
  cmp_to_bits(n, "101000110");
  n = reset(n);
  n = n.add(LEFT_RIGHT_LEFT);
  cmp_to_bits(n, "101001000110");
  n = reset(n);
  n = n.add(LEFT_RIGHT_LEFT);
  cmp_to_bits(n, "101001001000110");
  n = reset(n);
  n = n.add(LEFT_RIGHT_LEFT);
  cmp_to_bits(n, "101001001001000110");
  n = reset(n);
  cmp_to_bits(n, "101001001001000110");
});

test("test_revive_index", () => {
  for(let idx=0;idx<2048;idx++){
    const n = new NodePath(idx);
    const n1 = reset(n);
    expect(n.as_short_path().equal_to(n1.as_short_path())).toBeTruthy();
  }
});
