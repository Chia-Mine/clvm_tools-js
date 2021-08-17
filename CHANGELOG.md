# Changelog

## [0.1.7]
### Changed
- Changed `OperatorDict` arguments format.
- Huge performance improvement by upgrading `clvm` to v1.0.6.
- Greatly reduced max stack memory consumed
  - by merged `tokenize_cons` into `tokenize_sexp`. (Converted recursive function calls into loop)
  - by fully flatten `assemble_from_ir` which dispatched recursive function call and consumed a lot of stack memory.
  - Before this update, executing `ir_read` on deeply nested S-exp(s.t. over 1500 depth) failed due to `Maximum call stack size exceeded` error.
- Changed the time unit(ms->sec) of output with `--time` option, to be compatible with Python's `clvm_tools`.
### Added
- Added benchmark scripts.
- Added webpack config to build js file for browser.
- Added `clvm_tools.go(...args)` function to dispatch cli commands from javascript.
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

[0.1.7]: https://github.com/Chia-Mine/clvm_tools-js/compare/v0.1.6...v0.1.7
[0.1.6]: https://github.com/Chia-Mine/clvm_tools-js/compare/v0.1.5...v0.1.6
[0.1.5]: https://github.com/Chia-Mine/clvm_tools-js/compare/v0.1.4...v0.1.5
[0.1.4]: https://github.com/Chia-Mine/clvm_tools-js/compare/v0.1.2...v0.1.4
[0.1.2]: https://github.com/Chia-Mine/clvm_tools-js/compare/v0.1.0...v0.1.2
[0.1.1]: https://github.com/Chia-Mine/clvm_tools-js/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/Chia-Mine/clvm_tools-js/releases/tag/v0.1.0
