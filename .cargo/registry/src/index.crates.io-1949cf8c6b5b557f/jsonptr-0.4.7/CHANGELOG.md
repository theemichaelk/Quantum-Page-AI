# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.7] 2024-03-18

-   Fixes issue with `pop_front` on a token with an empty string leaving the pointer in an invalid state. #25 by [@wngr](https://github.com/wngr)
-   Fixes issue with `pop_back` on a token with an empty string. #26 by [@asmello](https://github.com/asmello)

## [0.4.6] 2024-03-24

-   Fixes `Pointer::last` panicking for empty/root pointers #23 by [@wngr](https://github.com/wngr)

## [0.4.5] 2024-02-23

### Fixed

-   Fixes issue with `Pointer::push_back` that does not allow for empty strings
    to be appended as tokens. #21 fixed by [@wngr](https://github.com/wngr)

## [0.4.3] 2023-08-20

### Added

-   Adds `parse` method to `Pointer` which calls the currently existing `FromStr`
    impl

## [0.4.2] 2023-06-23

### Added

-   implements `IntoIterator` for `&Pointer`

## [0.4.1] 2023-06-21

### Added

-   implements `Borrow<[u8]>` and `AsRef<[u8]>` for `Pointer`

## [0.4.0] 2023-05-31

### Added

-   Adds `CHANGELOG.md` which will be better upkept moving forward.
-   Adds `MaybePointer` to assist with deserialization which should not fail fast.

### Changed

-   `Pointer::new` now accepts a generic list, so `&["example"]` can be replaced by `["example"]`. For untyped, empty slices (i.e. `Pointer::new(&[])`), use `Pointer::default()`.
-   `std` is now enabled by default.

### Removed

-   Removes optional `MalformedPointerError` from `Pointer`.

## [0.3.6] 2023-05-23

### Changed

-   Adds quotes around `Pointer` debug output (#11)

### Fixed

-   Adds missing `impl std::error::Error` for `Error`, `NotFoundError`, `MalformedError`
-   Fixes build for `std` feature flag

## [0.3.4] 2023-05-11

### Added

-   Adds feature flag `fluent-uri` for `From<fluent_uri::Uri<_>` impl (#3)

## [0.2.0] 2023-02-24

### Changed

-   `std` is now optional
-   Adds feature flags `"uniresid"`, `"url"` to enable implementing `From<Uri>`, `From<Url>` (respectively).

### Removed

-   Removes `Cargo.lock`
-   Makes `uniresid` and `uri` optional

## [0.1.0] - 2022-06-12

### Fixed

-   Fixes root pointer representation `""` rather than the erroneous `"/"`
-   Fixes an issue where encoded tokens were not being resolved properly
