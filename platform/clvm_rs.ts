const imports: WebAssembly.Imports = {};
export let wasm: any;

let cachegetUint8Memory0: Uint8Array|null = null;
function getUint8Memory0() {
  if (cachegetUint8Memory0 === null || cachegetUint8Memory0.buffer !== (wasm.memory as WebAssembly.Memory).buffer) {
    cachegetUint8Memory0 = new Uint8Array((wasm.memory as WebAssembly.Memory).buffer);
  }
  return cachegetUint8Memory0;
}

let WASM_VECTOR_LEN = 0;

function passArray8ToWasm0(arg: Uint8Array, malloc: (size: number) => number) {
  const ptr = malloc(arg.length * 1);
  getUint8Memory0().set(arg, ptr / 1);
  WASM_VECTOR_LEN = arg.length;
  return ptr;
}

let cachegetInt32Memory0: Int32Array|null = null;
function getInt32Memory0() {
  if (cachegetInt32Memory0 === null || cachegetInt32Memory0.buffer !== (wasm.memory as WebAssembly.Memory).buffer) {
    cachegetInt32Memory0 = new Int32Array((wasm.memory as WebAssembly.Memory).buffer);
  }
  return cachegetInt32Memory0;
}

function getArrayU8FromWasm0(ptr: number, len: number) {
  return getUint8Memory0().subarray(ptr / 1, ptr / 1 + len);
}
/**
 * @param {Uint8Array} program
 * @param {Uint8Array} args
 * @returns {Uint8Array}
 */
export function run_clvm(program: Uint8Array, args: Uint8Array) {
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
    const ptr0 = passArray8ToWasm0(program, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passArray8ToWasm0(args, wasm.__wbindgen_malloc);
    const len1 = WASM_VECTOR_LEN;
    wasm.run_clvm(retptr, ptr0, len0, ptr1, len1);
    const r0 = getInt32Memory0()[retptr / 4 + 0];
    const r1 = getInt32Memory0()[retptr / 4 + 1];
    const v2 = getArrayU8FromWasm0(r0, r1).slice();
    wasm.__wbindgen_free(r0, r1 * 1);
    return v2;
  } finally {
    wasm.__wbindgen_add_to_stack_pointer(16);
  }
}

export type TInitOption = {
  pathToWasm: string;
  fetchOption: RequestInit;
};
const defaultPathToClvmRsWasm = "./clvm_rs_bg.wasm";
export async function initialize(option?: TInitOption){
  let wasmModule;
  if (typeof window === "undefined") {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const path = require.resolve("clvm_rs/clvm_rs_bg.wasm");
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const bytes = require("fs").readFileSync(path);
  
    wasmModule = new WebAssembly.Module(bytes);
  }
  else {
    const url = (option && option.pathToWasm) || defaultPathToClvmRsWasm;
    const mod = await fetch(url, option && option.fetchOption);
    wasmModule = new WebAssembly.Module(await mod.arrayBuffer());
  }
  const wasmInstance = new WebAssembly.Instance(wasmModule, imports);
  wasm = wasmInstance.exports;
}
