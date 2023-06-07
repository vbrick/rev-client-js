## 0.12.1

* added `vtt` to mimetypes
* fixed bug in setting content-type for non-video uploads

## 0.12.0

### Features

* Add user notification/subscription endpoints
* Add admin user location service and get expiration rules endpoints
* Other 7.51 / 7.52 endpoints and updates

### Breaking Changes

* Stop a search request pager early if a page has zero results. This is a bugfix for the Get Guest Registration List API endpoint, but may impact other search results.

### Bugfixes

* bugs in new oauth2 endpoint support

### Experimental

* Add IIFE compiled version - `/dist/rev-client.iife.js`. Global name is `revClientLib`. Filename / global subject to change in future releases

## 0.11.0

### Features

* Added JWT, OAuth2 and Access Token (no credentials, just existing access token) credentials options
* Added `video.setCustomFied` to only update a single custom field value for a video
* Added a `native-fetch` nodejs version that doesn't use polyfills (node-fetch / form-data). **NOTE:** There may be a [negative performance impact](https://github.com/nodejs/undici/issues/1203) for using node's built-in `fetch` implementation pre-node v20, especially on downloading video files.
* Switched to tsup instead of rollup for bundling
* Bump dependencies

### Breaking Changes
* Require node v16 or above
* some typescript types were corrected *(for example video search date options like `fromUploadDate` only support `string`, not `Date | string`)*.


### Bugfixes
* Channel search results correction
* get video chapters was returning empty results
* minor typescript bugfixes
* Exports `utils.rateLimit`, `utils.getExtensionForMime` and `utils.getMimeForExtension` functions weren't exposed for the commonjs exports

### Deprecations
* The Legacy OAuth API endpoints - which use API Key / Client ID plus Secret are deprecated in favor of the new OAuth2-compliant API endpoints, which use a PKCE login flow.

## 0.10.0

### Features

* Added more missing upload functions (i.e. `upload.thumbnail`, `upload.chapters`)
* Support passing `signal` to upload/download functions to abort early.
* Added additional `utils` export.

### Breaking Changes

* Namespaced some Typescript types, for example `Video.CommentRequest` became `Video.Comment.Request`

### Bugfixes

* Minor Typescript types cleanup

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