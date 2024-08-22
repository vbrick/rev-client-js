## 0.21.4

* Optimize downloading thumbnail when selecting by Video Id *(`rev.video.downloadThumbnail({ videoId })`)*
* Add optional request options `options` parameter to `webcast.list()`, `webcast.details()` and `webcast.status()`

## 0.21.3

* Add Rev 7.59 APIs
* *typescript* - Add missing Video Search `SortField` enum values

## 0.21.2

### Bugfixes

* fixed `Webcast.Status` type - *(`status` instead of `eventStatus`)*
* handle parsing of 400 error response on `webcast.attendees` endpoint

## 0.21.1

### Features

* Added rate limiting on Video View Report endpoint (default: 120/min)

### Possibly Breaking Change
* Change default keep alive interval to 10 minutes instead of 5 minutes. This value can be customized when setting the rev config:

```js
const rev = new RevClient({
    ...
    keepAliveInterval: 5 * 60 * 1000 // set keep alive interval to 5 minutes (in milliseconds)
})
```

## 0.21.0
* Add Rev 7.58 APIs
* added Video Replace method `upload.replaceVideo`
* added Video Translate/Transcribe APIs
* added `video.setAudioLanguage` helper to set the language for the default audio track

### **Bugfixes**

* Fix bug when uploading files when using node.js and native fetch

### **Deprecations**
* `user.details(usernameOrEmail, type)` has changed to pass in an object as second parameter (old method is still supported). Use `user.details(username, {lookupType: 'username'})` or `user.details(email, {lookupType: 'email'})` instead.

### **Possibly Breaking Change**
* **Types only** - `Video.Transcription` namespace moved to own namespace `Transcription`


## 0.20.2

### **Possible Breaking Changes**
* Require node v18 or higher.

### Features
* Add Rev 7.56 + 7.57 APIs
* Add dynamic playlist API support
* **Node.js** - Add ability to set preference for a Web Stream `ReadableStream` or the NodeJS `Readable` stream when using `responseType: 'stream'` -- usually only used for video downloads. This is for future compatibility changes when shifting from `node-fetch` to native nodejs `fetch` as the default.

### Bugfixes
* Don't block transcription uploads if language isn't recognized
* webcast.pollResults: return array instead of {polls: array}

## 0.17.1

### Features
* Minify IIFE version for ~50Kb size savings
* Hardcode `RevError` classname to avoid mangling by build process

### Bugfixes
* Removed `RateLimitEnum` from main exports, which was only partially added in v0.16
* Make session rate limit queues non-enumerable
* Clean up top level exports

## 0.17.0

### **Deprecations**
* In an upcoming major release this library will remove the `node-fetch` dependency in favor of node's built-in fetch functionality. The native fetch functionality is available now by using the `@vbrick/rev-client/native-fetch` export.

### Features

* Added Video [External Access endpoints](https://revdocs.vbrick.com/reference/getvideoexternalaccess)
* Added User Details `status` property to TS types
* Updated Video types with latest changes in Rev 7.56

### Bugfixes
* Bugfix in audit parsing of date ranges

## 0.16.1

### Features

* Add `entityId` into Audit response entries

### Bugfixes

* fix how audit endpoints pass parameters

## 0.16

### Features

* Add rate limiting option. This feature is disabled by default - add by including `rateLimits: true` when initializing `RevClient`.

* Add Get Users by Login API endpoint

### Breaking Changes

* `rateLimit` now correctly handles limit options (`perSecond`, `perMinute`) that are less than 1. For example, `{ perSecond: 0.5 }` will be interpreted as "once every 2 seconds". Previously it was interpreted as "2 every second". This only impacts code if you used the `utils.rateLimit` function and specified a value less than 1.

## 0.15.1

### Bugfixes
* `accessToken`-based sessions now return correct response when calling `verifySession()`

## 0.15.0

### Features
* Add additional [environment api](README.md#environment).
* Add additional `publicOnly` option to [`Rev.Credentials`](README.md#options)
* Add additional Guest Registration login option
* Add `webcast.playbackUrls()` to match `video.playbackUrls()` shape

### Deprecations
* Deprecate `webcast.playbackUrl()` *(use `webcast.playbackUrls()` instead)*

### Bugfixes
* Correct `Video.Transcription` type definition

## 0.14.0

### Features
* Add optional `options` parameter to authentication API calls, to allow passing a custom `User-Agent` / `Authorization` headers. This may be needed if generating tokens server-side for use in the browser, where user agent mismatches can cause video playback issues. Also note that you can pass `{ headers: { Authorization: '' } }` to not pass any existing authentication token.
* Added `video.playbackUrls` endpoint (Get Video Playback URLS)

## 0.13.1

### Features

* Add `video.waitTranscode(videoId, options)` helper - this function simplifies the process of querying the [https://revdocs.vbrick.com/reference/getvideostatus](Get Video Status) API to check if a video has finished processing after upload.
* Added `admin.featureSettings()` wrapper for the [https://revdocs.vbrick.com/reference/getvideofeatures-1](Get Video Feature Settings API)
* Added `video.patch()` for calling the Video Patch API
* export `Rev.FileUploadType` and `Rev.UploadFileOptions` to make typing uploads easier

### Breaking Changes
* `admin.getRoleByName()` now prefers comparing against the `roleType` value in the Get Roles API response, falling back to the Role Name (which is translated depending on user's language settings).
* Role type's `name` field values changed to better reflect the actual response. The underlying type `string` did not change.
* `utils.rateLimit()`'s `.abort()` helper in response now includes optional `message` and `dispose` parameters.

### Bugfixes

* Fixed Chapter upload
* Avoid memory leaks when adding AbortSignal listeners.

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