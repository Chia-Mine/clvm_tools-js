# Changelog

## [0.9.6]
### Changed
- Updated `clvm` to v2.0.0
- Replaced `clvm_rs` with `clvm_wasm`
- Renamed `--experiment-backend` flag to `--backend`
- Now `--backend python` must be `--backend js`
### Added
- Added tests for `div` operator

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

[0.9.6]: https://github.com/Chia-Mine/clvm_tools-js/compare/v0.9.5...v0.9.6
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
