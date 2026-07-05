# Typescript + React + Vite

## Setup
```shell
pnpm install
pnpm build # ./.dist folder will be created
```

## Start dev server
```shell
pnpm start
```

## WebAssembly files
`clvm_tools.initialize()` loads `blsjs.wasm` and `clvm_wasm_bg.wasm` from the root path
of the current url when the code runs as an ESModule. During development, the proxy in
`vite.config.ts` rewrites those requests to `/public/assets/`.
When deploying a production build, copy `node_modules/clvm_tools/browser/blsjs.wasm` and
`node_modules/clvm_tools/browser/clvm_wasm_bg.wasm` to the root path of your site.
