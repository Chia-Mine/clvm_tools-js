# clvm_tools

Javascript implementation of clvm_tools (clvm = Chia Lisp VM)  

## Install
```shell
npm install clvm_tools
# or
yarn add clvm_tools
```

## Compatibility
This code is compatible with:
- [`a349e6288779842eaf44c728e34308f18b82d9be`](https://github.com/Chia-Network/clvm_tools/tree/a349e6288779842eaf44c728e34308f18b82d9be) of [clvm_tools@0.4.3](https://github.com/Chia-Network/clvm_tools)
  - [Diff to the latest clvm_tools](https://github.com/Chia-Network/clvm_tools/compare/a349e6288779842eaf44c728e34308f18b82d9be...main)
- [`4f6ef2c9ded6b550506773183554e7582a6eeea5`](https://github.com/Chia-Network/clvm_rs/tree/4f6ef2c9ded6b550506773183554e7582a6eeea5) of [clvm_rs@0.1.10](https://github.com/Chia-Network/clvm_rs)
  - [Diff to the latest clvm_rs](https://github.com/Chia-Network/clvm_rs/compare/4f6ef2c9ded6b550506773183554e7582a6eeea5...main)

## Examples
### Command line
If you have `npx` installed, you even do not need to have `clvm_tools` installed.
```shell
$ npx clvm_tools run "(mod ARGUMENT (+ ARGUMENT 3))"
(+ 1 (q . 3))
```
```shell
$ npx clvm_tools brun "(+ 1 (q . 3))" "2"
5
```

### NodeJS
```javascript
const clvm_tools = require("clvm_tools");

// You can skip async-initialization below until `op_pubkey_for_exp` or `op_point_add` is called
await clvm_tools.initialize(); 

clvm_tools.go("run", "(mod ARGUMENT (+ ARGUMENT 3))");
// (+ 1 (q . 3))
clvm_tools.go("brun", "(+ 1 (q . 3))", "2");
// 5
clvm_tools.go("brun", "(+ 1 (q . 3))", "2", "--time", "--experiment-backend", "rust"); // use clvm_rs for backend
// assemble_from_ir: 0.00034061598777768154
// to_sexp_f: 0.0005161969661706678
// run_program: 0.0003017840385446391
// 5
```

## Integrate `clvm_tools` into web application
If you develop web application with `clvm_tools` which runs on browser, you need to import module from `clvm_tools/browser`.  
`clvm_tools/browser` replaces read/write io target from local file system to browser's `localStorage`.  
So if you do `clvm_tools.go("brun", "/path/to/clvm/file", "2")`, it searches localStorage with the key `"/path/to/clvm/file"`.  
In such a case, you need to pre-allocate clvm content into localStorage just like saving contents into a file.

### Using localStorage as a pseudo file system
`window.localStorage` is a simple key-value store.  
It stores string key and string data, and it returns string data by associated key.  
If you want to manually store data `"(+ 1 (q . 3))"` to the file path `"/path/to/clvm/file"` with `localStorage`,  
you need to follow the steps described below.  
```javascript
// 1. Create a file object
var fileObj = {
  encode: "string", // "string" or "hex". For now, there are no situations to use 'hex'.
  data: "(+ 1 (q . 3))", // If 'encode' is 'hex' this should be hex string and it will be decoded as binary data.
};
// 2. Stringify the object
var fileObjStr = JSON.stringify(fileObj);
// 3. Finally save it to the localStorage
localStorage.setItem("/path/to/clvm/file", fileObjStr);

// Then clvm_tools recognizes it as a file.
clvm_tools.go("brun", "/path/to/clvm/file", "2");
// output: 5
```

### WebAssembly files
Some parts of `clvm_tools`/`clvm` depend on WebAssembly.  
For example:
- `op_point_add` and `op_pubkey_for_exp` relies on wasm build of [bls-signatures](https://github.com/Chia-Mine/bls-signatures/tree/npm).
- `brun` option `--experiment-backend clvm_rs` relies on wasm build of [clvm_rs](https://github.com/Chia-Network/clvm_rs)

#### .wasm file installation
In order for those wasm files to be loaded correctly, you need to make sure that the wasm files are stored in the same folder as the main js file, which `clvm_tools` is bundled into.

<pre>
├── ...
├── main.js          # js file which clvm_tools is bundled/merged into.
├── clvm_rs_bg.wasm  # copy it from node_modules/clvm_tools/browser/clvm_rs_bg.wasm
└── blsjs.wasm       # copy it from node_modules/clvm_tools/browser/blsjs.wasm
</pre>

If you use [React](https://reactjs.org/), please copy `blsjs.wasm` and `clvm_rs_bg.wasm` in `node_modules/clvm_tools/browser/` to `<react-project-root>/public/static/js`.  
React automatically copies wasm files next to the main js file on building.  
(if you use react-scripts, or you started project by `create-react-app`)

#### .wasm file manual loading
The .wasm files are not loaded automatically. It requires programmer to fetch and load wasm files in the following way.
```typescript
// Typescript
import * as clvm_tools from "clvm_tools/browser";
// ...

// This 'clvm_tools.initialize()' fetches and loads wasm files from the same path of the current js file location.
// 
// For example, if url of the js file currently running is 'https://example.com/aaa/bbb/main.js',
// it tries to fetch wasm files from 'https://example.com/aaa/bbb/blsjs.wasm'
// and 'https://example.com/aaa/bbb/clvm_rs_bg.wasm'
await clvm_tools.initialize();

// ...
```
Note that if you are really sure that you never use `op_point_add` and `op_pubkey_for_exp` and `clvm_rs` as a backend,  
then you can skip the above async initialization. It never raises an exception until those wasm files are actually required.

### Example
#### Typescript + Webpack
See code sample [here](./.example/typescript_webpack)



## clvm_tools license
`clvm_tools-js` is based on [clvm_tools](https://github.com/Chia-Network/clvm_tools) with the
[Apache license 2.0](https://github.com/Chia-Network/clvm_tools/blob/main/LICENSE)

## bls-signatures license
[bls-signatures](https://github.com/Chia-Network/bls-signatures) is used under the
[Apache license 2.0](https://github.com/Chia-Network/bls-signatures/blob/main/LICENSE)
