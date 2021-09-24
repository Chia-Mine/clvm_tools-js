# clvm_tools

Javascript implementation of clvm_tools (clvm = Chia Lisp VM)  

## Warning - future of version 0.x.x
In version 0.x.x, I may introduce several breaking changes in the future.  
So please consider `clvm_tools-js < v1.0.0` as a trial version and Proof of Concept.

I'm currently planning a breaking change, which is **filesystem abstraction on browser**.  
So if you intend to use `clvm_tools-js` in NodeJS (not browser), it is possible that version 0.x.x and 1.0.0 will have no difference. (I cannot assure you though)

At current version, you can create virtual files into browser's localStorage as described in [Using localStorage as a pseudo file system](#using-localstorage-as-a-pseudo-file-system)  
But this is a poor implementation compared to actual filesystem on OS as it lacks concept of 'directory'. (You can still mimic a directory by setting sharing part of path as a key of localStorage)

Maybe You want to set `--include/-i` option to load chialisp libraries to run the same program as that of `chia-blockchain`.  
But it is so painful to create and manage library files with such a poor pseudo filesystem with localStorage.
That's why I decided take time to bring more well-designed filesystem implementation.

## Install
```shell
npm install clvm_tools
# or
yarn add clvm_tools
```

## Test
`clvm_tools-js` passes all the test equivalent to Python's original `clvm_tools`.  
You can compare test files for [Javascript](./tests) and [Python](https://github.com/Chia-Network/clvm_tools/tree/main/tests)  
To run the test, execute the following command.
```shell
git clone https://github.com/Chia-Mine/clvm_tools-js
cd clvm_tools-js

npm install
npm run test
# or
yarn
yarn test
```
If you find something not compatible with Python's clvm_tools, please report it to GitHub issues.

**Note**: Currently wasm build of `clvm_rs` is not fully compatible with Python's build of `clvm_rs`.
See details [here](https://github.com/Chia-Network/clvm_rs/issues/108).

## Compatibility
This code is compatible with:
- [`a349e6288779842eaf44c728e34308f18b82d9be`](https://github.com/Chia-Network/clvm_tools/tree/a349e6288779842eaf44c728e34308f18b82d9be) of [clvm_tools](https://github.com/Chia-Network/clvm_tools)
  - [Diff to the latest clvm_tools](https://github.com/Chia-Network/clvm_tools/compare/a349e6288779842eaf44c728e34308f18b82d9be...main)
- [`05fda8b454ff871b91f400f00f3a3b7fa6d02d08`](https://github.com/Chia-Network/clvm_rs/tree/05fda8b454ff871b91f400f00f3a3b7fa6d02d08) of [clvm_rs](https://github.com/Chia-Network/clvm_rs)
  - [Diff to the latest clvm_rs](https://github.com/Chia-Network/clvm_rs/compare/05fda8b454ff871b91f400f00f3a3b7fa6d02d08...main)

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
// or dispatch run/brun command with "--experiment-backend rust" option
await clvm_tools.initialize(); 

clvm_tools.go("run", "(mod ARGUMENT (+ ARGUMENT 3))");
// (+ 1 (q . 3))
clvm_tools.go("brun", "(+ 1 (q . 3))", "2");
// 5

// use clvm_rs for backend
clvm_tools.go("brun", "(+ 1 (q . 3))", "2", "--time", "--experiment-backend", "rust");
// assemble_from_ir: 0.00034061598777768154
// to_sexp_f: 0.0005161969661706678
// run_program: 0.0003017840385446391
// 5
```

## Integrate `clvm_tools` into web application
If you develop web application with `clvm_tools` which runs on browser, you need to import module from `clvm_tools/browser`.
```typescript
import * as clvm_tools from "clvm_tools/browser";
```
`clvm_tools/browser` switches read/write IO operation to browser's `localStorage` from OS's file system.  
So if you do `clvm_tools.go("brun", "/path/to/clvm/file", "2")`, it searches localStorage with the key `"/path/to/clvm/file"`.  
In such a case, you need to pre-allocate clvm content into localStorage just like saving contents into a file.

### Using localStorage as a pseudo file system
**NOTE: As I described [at the very beginning of this README](#warning---future-of-version-0xx), I will introduce breaking change to this pseudo file system at v1.0.0**

`window.localStorage` is a simple key-value store.  
It stores string key and string data, and it returns string data by associated key.  
If you want to manually store data `"(+ 1 (q . 3))"` to the file path `"/path/to/clvm/file"` with `localStorage`,  
you need to follow the steps described below.  
```javascript
// 1. Create a file object
var fileObj = {
  mTimeMs: Date.now(), // Modified time.
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

### Redirect output/error from `console.log`
By default, command outputs are printed to browser's dev console.  
So if you want to capture those output, you need to redirect console output to somewhere you want.
```typescript
import * as clvm_tools from "clvm_tools/browser";

const stdoutEl = document.getElementById("...") as HTMLElement;
const printFn = (...messages: any[]) => {
  stdoutEl.textContent = (stdoutEl.textContent || "") + (messages.join(" ") + "\n");
};

clvm_tools.setPrintFunction(printFn);
```

### WebAssembly files
Some parts of `clvm_tools`/`clvm` depend on WebAssembly.  
For example:
- `op_point_add` and `op_pubkey_for_exp` relies on wasm build of [bls-signatures](https://github.com/Chia-Mine/bls-signatures/tree/npm).
- option `--experiment-backend clvm_rs` for `run` and `brun` commands relies on wasm build of [clvm_rs](https://github.com/Chia-Network/clvm_rs)

#### .wasm file installation
In order for those wasm files to be loaded correctly, you need to make sure that the wasm files are stored in the same folder as the main js file, which `clvm_tools` is bundled into.

<pre>
├── ...
├── main.js          # js file which clvm_tools is compiled into.
├── clvm_rs_bg.wasm  # copy it from node_modules/clvm_tools/browser/clvm_rs_bg.wasm
└── blsjs.wasm       # copy it from node_modules/clvm_tools/browser/blsjs.wasm
</pre>

**Note1**: If you use [React](https://reactjs.org/), please copy `blsjs.wasm` and `clvm_rs_bg.wasm` in `node_modules/clvm_tools/browser/` to `<react-project-root>/public/static/js/`.  
React automatically copies wasm files next to the main js file on building. (if you use react-scripts, or you started project by `create-react-app`)  
**Note2**: Redistributing your project with bundled `blsjs.wasm` and/or `clvm_rs_bg.wasm` must be compliant with Apache2.0 License provided by [Chia-Network](https://github.com/Chia-Network/)

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

### Browser compatibility
`clvm-tools-js` uses `BigInt`. So if runtime environment does not support `BigInt`, `clvm_tools-js` doesn't work as well.  
If you transpile code using babel or something which uses babel (like create-react-app),
you need to tell the transpiler to optimize code only for the target browsers.  
Just copy and paste below to your `package.json` and you can avoid a lot of runtime incompatibility issues.
```
"browserslist": [
  "edge >= 79",
  "firefox >= 68",
  "chrome >= 67",
  "safari > 14",
  "opera >= 54",
  "ios_saf >= 14.4",
  "android >= 67",
  "op_mob >= 48",
  "and_chr >= 67",
  "and_ff >= 68",
  "samsung >= 9.2",
  "node >= 10.4.0",
  "electron >= 4.0.0"
]
```

### Example
- [Typescript + Webpack](./.example/typescript_webpack)
- [Typescript + React](./.example/typescript_react)



## clvm_tools license
`clvm_tools-js` is based on [clvm_tools](https://github.com/Chia-Network/clvm_tools) with the
[Apache license 2.0](https://github.com/Chia-Network/clvm_tools/blob/main/LICENSE)

## clvm_rs license
Wasm build of [clvm_rs](https://github.com/Chia-Network/clvm_rs) is redistributed under the
[Apache license 2.0](https://github.com/Chia-Network/clvm_rs/blob/main/LICENSE)

## bls-signatures license
Wasm build of [bls-signatures](https://github.com/Chia-Network/bls-signatures) is redistributed under the
[Apache license 2.0](https://github.com/Chia-Network/bls-signatures/blob/main/LICENSE)
