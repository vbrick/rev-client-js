## 0.9.0

### Deprecations
* Future releases will likely remove `commonjs` support for legacy node.js environments and move to ESM only.
* `rev.webcasts` is deprecated. Use `rev.webcast` instead.

### Features
* Added `session` parameter to constructor to pass in token/expiration at initialization, as well as `sessionState` getter/setter on `RevClient` to make re-using sessions easier
* Added webcast -> GuestRegistration and admin -> WebcastField API methods
* Added webcast event summary fields introduced in Rev 7.45
* Added webcast registration fields endpoints

### Breaking Changes
* Changed signature of OAuth functions to reduce chance of OAuth secret accidentally being exposed
* Changed `type` to `module` for better webpack/browser support.
* Changed the `session` parameter in the constructor to specify session `token`/`expiration` rather than undocumented method of setting `IRevSession` implementation.
* `rev.webcasts` was renamed to `rev.webcast` to match other api namespaces

### Bugfixes
* fix for OAuth `buildOAuthAuthenticateURL` in node.js.
* fix for audit `audit.accountUsers` and `audit.user` methods

### Other changes
* Updated typescript for latest Rev (7.45) payloads.
* Upgraded to typescript 4.5

## 0.8.0

### Features
* Added `rev.video.migrate`, `rev.video.chapters`, `rev.video.comments`, `rev.video.transcriptions` and `rev.video.supplementalFiles` API endpoints
* Added additional download APIs

### Other changes
* Updated typescript types to reflect latest Rev (7.44) request/response payloads

## 0.7.0

### Features
* Added video report API wrapper (`rev.video.report`)
* Added `throwHttpErrors` options to `RevClient.request()` to control if http error codes are treated as errors
* Video Search option `onScrollExpired` deprecated in favor of `onError`
* `rev.user.details` now accepts a `type` parameter, replacing `rev.user.getByUsername` and `rev.user.getByEmail`
* Added `rev.user.exists` helper to check if user exists

### Breaking Changes
* `AbortError` no longer exported *(intended as node.js-only polyfill)*
* Some typescript types re-arranged.

### Bugfixes
* some minor typescript type fixes

### Other changes
* refactor search request wrappers

## 0.6.0
Initial public release