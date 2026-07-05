# Changelog

## [0.11.0]
### Changed
- Upgraded `clvm` from `4.0.1` to `4.1.0`, whose bundled `clvm_wasm` moved from `0.7.0` to `0.16.2` (about two years of `clvm_rs` runtime updates)
  - **Behavior change**: `brun` with the Rust backend now allows `div` with negative operands and computes floor division, matching current `clvm_rs` (0.18.0) consensus behaviour. The old wasm's `FAIL: div operator with negative operands is deprecated` was pre-hard-fork behaviour. 4 test expectations updated and verified byte-exact against `clvm_rs` directly
  - Note: this deliberately diverges from the current Python `clvm_tools` CLI output, whose Rust backend is silently broken with `clvm_rs` >= 0.17 (`run_serialized_chia_program` no longer exists, so it falls back to the python backend, and Python's `clvm` still rejects negative operands)
### Errata
- The 0.10.0 notes attributed the acceptance of `((X)...)` forms to the old bundled `clvm_wasm` lagging `clvm_rs`. That was incorrect: `clvm_rs` 0.18 accepts those forms as well; the rejection only exists in Python's `clvm` evaluator. There is no consensus divergence there

## [0.10.0]
This version is compatible with [`2e6c303990ae9b483e17a160a13d0f04de513c72`](https://github.com/Chia-Network/clvm_tools/tree/2e6c303990ae9b483e17a160a13d0f04de513c72) of [clvm_tools](https://github.com/Chia-Network/clvm_tools)
### Breaking Change
- Upgraded `clvm` from `1.0.9` to `4.0.1`
  - `None` is now `undefined` (previously `null`)
  - `op_div` no longer accepts negative operands
  - `sha256tree`/serialization behaviour follows clvm 4.0.1
- Removed the `clvm_rs` dependency. The Rust execution backend is now provided by `clvm_wasm`, which is bundled with `clvm@4.0.1`
  - `initialize()` no longer takes an option for loading `clvm_rs_bg.wasm`. Deploy `clvm_wasm_bg.wasm` (from `clvm_tools/browser/`) instead of `clvm_rs_bg.wasm` in browser environments
- `brun` now uses the Rust (`clvm_wasm`) backend automatically when no tracing options are given, like the Python version. Reported costs change accordingly (the `(a 2 3)` wrapper and its compensating cost offset were removed)
  (Ported from [clvm_tools#80](https://github.com/Chia-Network/clvm_tools/pull/80), [#82](https://github.com/Chia-Network/clvm_tools/pull/82), [#89](https://github.com/Chia-Network/clvm_tools/pull/89), [#92](https://github.com/Chia-Network/clvm_tools/pull/92), [#100](https://github.com/Chia-Network/clvm_tools/pull/100), [#101](https://github.com/Chia-Network/clvm_tools/pull/101))
- Renamed the `--experiment-backend` option to `--backend`
- Added `--mempool` option; `--strict` is now a deprecated alias for it
- Removed stage 1 (`-s 1`), which upstream declared a dead end and deleted
- Atoms containing a double-quote or whitespace other than the space character now disassemble as hex instead of a quoted string
  (Ported from [clvm_tools#97](https://github.com/Chia-Network/clvm_tools/pull/97) and [#109](https://github.com/Chia-Network/clvm_tools/pull/109))
- `compile_clvm` now wraps hex output at 80 characters per line
  (Ported from [clvm_tools#76](https://github.com/Chia-Network/clvm_tools/pull/76))
### Changed
- Replaced `yarn.lock` with `pnpm-lock.yaml` (converted with `pnpm import`, keeping dependency versions unchanged)
- CI now installs with `pnpm install --frozen-lockfile`, runs on pull requests targeting `main` and pushes to `main`, uses a read-only token and SHA-pinned actions, and runs on Node 20
- Upgraded `webpack` to `5.108.4` so `pnpm build` works on Node 17+ (the previous version used an md4 hash removed from OpenSSL 3)
- All dependencies in `package.json` are now pinned to exact versions (no `^` ranges) to protect against supply-chain attacks via newly published malicious versions
- Upgraded the dev toolchain (jest 29, TypeScript 5.4, eslint 8, etc.) and resolved all known security advisories; `pnpm audit` is clean
- Updated the example projects in `.example/`: bumped `clvm_tools` to `^0.10.0`, replaced `clvm_rs_bg.wasm` with `clvm_wasm_bg.wasm`, migrated the react example from create-react-app to Vite 6 + React 18, modernized and pinned all dependencies
### Notes
- Unlike the Python version, the `run` command keeps using the JavaScript stage-2 compiler instead of delegating to `clvm_tools_rs`. This avoids a new wasm dependency and keeps `-i` include paths and `.sym` output working through the pseudo file system in web browsers. All compiler outputs were verified to match the Python version
- All command outputs were verified against the current Python `clvm_tools`: 923 of 930 test commands produce byte-identical output. The remaining 7 differ only in error-message wording (BLS point decoding) or stricter `((X)...)` validation introduced in newer `clvm_rs` than the bundled `clvm_wasm` build

## [0.9.5]
### Changed
- Updated `clvm` to v1.0.9

## [0.9.4]
### Changed
- Use divmod instead of div
- Updated `clvm_rs` to v0.1.15

## [0.9.3]
### Changed
- Updated `clvm_rs` to v0.1.13

## [0.9.2]
### Changed
- Updated `clvm` to v1.0.8
- Added tests for clvm operations
### Fixed
- Fixed an issue where `blsjs.wasm` was not loaded during tests

## ~~0.9.1~~
This version was deleted/unpublished because I published useless uncompiled module to npm registry.

## [0.9.0]
### Changed
- Changed `OperatorDict` arguments format.
- Huge performance improvement by upgrading `clvm` to v1.0.7.
- Greatly reduced max stack memory consumed
  - by merged `tokenize_cons` into `tokenize_sexp`. (Converted recursive function calls into loop)
  - by fully flatten `assemble_from_ir` which dispatched recursive function call and consumed a lot of stack memory.
  - Before this update, executing `ir_read` on deeply nested S-exp(s.t. over 1500 depth) failed due to `Maximum call stack size exceeded` error.
- Changed the time unit(ms->sec) of output with `--time` option, to be compatible with Python's `clvm_tools`.
- Use `CLVMType` instead of `CLVMObject` as a valid type representation of `CLVMObject`.  
  (CLVMObject should not be used as a type because there might be number of type incompatibility due to new private field)
### Added
- Added benchmark scripts.
- Added webpack config to build js file for browser.
- Added `clvm_tools.go(...args)` function to dispatch cli commands from javascript.
- Added `--experiment-backend rust` option to use `clvm_rs`.
- Added [sample code](./.example)
### Fixed
- Fixed an issue where it did not correctly handle signed/unsigned integer from and to `Bytes`.
- Fixed an issue where large int was not recognized correctly.

## [0.1.6]
### Added
- Added license information to README.md
- Added tests and fixed bugs found

## [0.1.5]
### Changed
- Updated to clvm version to 0.1.5

## [0.1.4]
### Changed
- Updated .eslintignore

## [0.1.2]
### Fixed
- Fixed bugs found in test

## [0.1.1] -2021-06-29
### Fixed
- Fixed an issue where embedded `clvm_tools` command did not work on Linux because of windows-style newline

## [0.1.0] - 2021-06-29
Initial release.

[0.9.5]: https://github.com/Chia-Mine/clvm_tools-js/compare/v0.9.4...v0.9.5
[0.9.4]: https://github.com/Chia-Mine/clvm_tools-js/compare/v0.9.3...v0.9.4
[0.9.3]: https://github.com/Chia-Mine/clvm_tools-js/compare/v0.9.2...v0.9.3
[0.9.2]: https://github.com/Chia-Mine/clvm_tools-js/compare/v0.9.0...v0.9.2
[0.9.0]: https://github.com/Chia-Mine/clvm_tools-js/compare/v0.1.6...v0.9.0
[0.1.6]: https://github.com/Chia-Mine/clvm_tools-js/compare/v0.1.5...v0.1.6
[0.1.5]: https://github.com/Chia-Mine/clvm_tools-js/compare/v0.1.4...v0.1.5
[0.1.4]: https://github.com/Chia-Mine/clvm_tools-js/compare/v0.1.2...v0.1.4
[0.1.2]: https://github.com/Chia-Mine/clvm_tools-js/compare/v0.1.0...v0.1.2
[0.1.1]: https://github.com/Chia-Mine/clvm_tools-js/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/Chia-Mine/clvm_tools-js/releases/tag/v0.1.0
