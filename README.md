# Vbrick Rev Client Library (beta)

This is a javascript client library for interacting with the [Vbrick Rev API](https://revdocs.vbrick.com/reference). It should work in node.js 16+, browsers, and deno.

This library is intended for use with **[VBrick Rev](https://vbrick.com)**.

## Installation

#### Browser/deno
The compiled library is at `dist/rev-client.js`.

#### Node.js (v16+) 
```sh
npm install @vbrick/rev-client
```

## Compatibility

* **Browser** - This library is in ESM module format - it assumes use of an evergreen browser that has `fetch`, `AbortController`, etc.
* **node.js** - Node.js 16 or above required. It will work with commonjs (`require`) or ES Module (`import`) projects. It uses fetch polyfills (`node-fetch`) unless you import using the `@vbrick/rev-client/native-fetch` named export.
* **deno** - Should be compatible, though testing is limited. You'll need `--allow-net` permissions at minimum.

### Browsers and CORS support**
By default CORS (Cross Origin Resource Sharing) is **disabled** for Rev Cloud tenants. This means this library will not work out of the box in the browser. You should open a ticket with [Vbrick Support](https://portal.vbrick.com/open-a-case/) if this feature isn't yet configured.

To verify if CORS is enabled for your account check the headers response from `https://YOUR_REV_TENANT_URL/api/v2/accounts/branding-settings` - it doesn't require authentication.

***On-Prem note:** this library targets the latest version of Rev. Some API endpoints may not be available or work as expected in older versions of Rev On-Prem.*


## Example

```js
import {RevClient} from '/path/to/rev-client.js';

// create client object
const rev = new RevClient({
    url: 'https://my.rev.url',
    apiKey: 'my.user.apikey',
    secret: 'my.user.secret',
    // or can login via username + password
    // username: 'my.username',
    // password: 'my.password',
	logEnabled: true, // turn on debug logging
	keepAlive: true // automatically extend session
	rateLimits: true // automatically enforce rate limiting (avoid 429 error responses)
});

(async () => {
	// call login api and start session. will throw error if invalid login
	await rev.connect();

	// create a category
	const {categoryId} = await rev.category.create({ name: 'Created Via API' });

	// get details about this category
	const categoryDetails = await rev.category.details(categoryId);

	console.log('category details: ', categoryDetails);

	// get the account media contributor role
	const mediaContributorRole = await rev.admin.getRoleByName('Media Contributor');

	// create a new user, with the media contributor role
	const userId = await rev.user.create({
		username: 'new.user',
		firstname: 'new',
		lastname: 'user',
		roleIds: [mediaContributorRole.id]
	});

	// upload a video, and assign 'new.user' as the owner of that video, and add to the category created above
	// if browser instead of node.js - pass in a File object instead of the filepath
	const videoId = await rev.upload.video("/path/to/local/video.mp4", {
		uploader: 'new.user',
		title: 'video uploaded via the API',
		categories: [categoryDetails.name], // ['Created Via API']
		unlisted: true,
		isActive: true
		/// ...any additional metadata
	});

	console.log('Video uploaded!', videoId);

	await rev.disconnect();

})();

```

## Usage

**NOTE** Unless otherwise noted **all** methods of `RevClient` are async (they return a `Promise`)

### RevClient

#### `new RevClient(options)`

##### Options:

* `url`: **REQUIRED** - URL of Rev instance *(ex `https://company.rev.vbrick.com`)*
* `keepAlive`: `true`/`false` *(Default: `true`)* - If true then automatically extend the Rev session at regular intervals *(until `rev.disconnect()` is called)*. If false then you must manually call `extendSession()` to maintain a valid token.
* `rateLimits`: `true`/`false`/`RateLimitOptions` *(Default: `false`)* - Automatically throttle requests client-side to fit within Vbrick's [API Request Rate Limits](https://revdocs.vbrick.com/reference/rate-limiting). Note that the default values *(when value is `true`)* is set to the account maximum - see below `Rate Limits` section for how to customize.

* `logEnabled`: `true`/`false` *(Default: `false`)* - Enable/disable debug logging
* `log`: `(logLevel, ...args) => void` - Custom log function. Default is to log to console

And **one** of following login options (`apiKey`+`secret`, `username`+`password`, `oauthConfig`+`code`+`codeVerifier`, `jwtToken`, `guestRegistrationToken`+`webcastId`, `publicOnly`):

1. User API Key:

   * `apiKey`: User API Key of Rev User
   * `secret`: User Secret of Rev User

2. Username/Password login:

   * `username`: Username of Rev user.
   * `password`: Password of Rev user.

3. Legacy OAuth session *(**NOTE**: This is for OAuth 2.0 browser-redirect flow to create sessions, it's not intended for server-side only login)*.
     
* `oauthConfig`: OAuth configuration object
* `oauthConfig.oauthApiKey`: API key from Rev Admin -> Security. This is a DIFFERENT value from the User Token used for API login/extend session
* `oauthConfig.oauthSecret`: API secret from Rev Admin -> Security. This is a DIFFERENT value from a user's `secret`. **DEPRECATED** - only for Legacy OAuth login
* `oauthConfig.redirectUri`: The local URL Rev should redirect user to after logging in. This must match EXACTLY what's specified in Rev Admin -> Security for the specified API key
* `authCode`: the Auth Code returned from the OAuth redirect response as a query parameter

4. OAuth2 session *(**NOTE**: This is for OAuth 2.0 browser-redirect flow to create sessions, it's not intended for server-side only login - use User API Key / JWT logins instead for this use case)*.
     
* `oauthConfig`: OAuth configuration object
* `oauthConfig.oauthApiKey`: API key from Rev Admin -> Security. This is a DIFFERENT value from the User Token used for API login/extend session
* `oauthConfig.redirectUri`: The local URL Rev should redirect user to after logging in. This must match EXACTLY what's specified in Rev Admin -> Security for the specified API key
* `code`: the Code returned from the OAuth redirect response as a query parameter
* `codeVerifier`: the Code Verifier used when initially generating the OAuth2 authorization URL. use `rev.auth.buildOAuth2Authentication()` to generate an OAuth2 authorization URL and corresponding codeVerifier.

5. JWT session:
   * `jwtToken`: The [JWT Token](https://revdocs.vbrick.com/reference/jwt-authentication)

6. Guest Registration session:
   * `guestRegistrationToken`: The [Token](https://revdocs.vbrick.com/reference/createguestwebcastuser-1) returned when creating a guest registration.
   * `webcastId`: ID of the webcast in question

7. Access Token *(existing sessions)*
   * `session.token`: The Access Token previously received via some login method (see below)
   * `session.expiration`: The expiration time of the session.

8. Public Only usage *(no authentication)*

* `publicOnly`: Don't use any authentication. This limits use to endpoints that don't require authentication.

##### Existing Sessions:

You can pass in an existing `session` to the constructor to reuse a session `token` (assuming it isn't expired). When you include `session` the additional credential values aren't necessary, however if not included you won't be able to re-login, just extend the session.

```js
const initialRev = new RevClient({ url, apiKey, secret });
await initialRev.connect();

// store state for use elasewhere (like /tmp/ storage in a serverless environment)
// has { token, expiration }
let savedState = rev.sessionState;

// ... time passes ...

const revWithReusedSession = new RevClient({ url, apiKey, sessionState: savedState })

// or set after initial configuration
revWithReusedSession.sessionState = savedState;

```

### RevClient session methods:


#### `connect()` - Login to Rev using configured credentials

#### `disconnect()` - Logoff from Rev and clear token

#### `extendSession()` - Extend current session token

#### `verifySession()` - Returns true/false on if the current token is valid

#### `isConnected` - Boolean value that indicates if `connect()` has been called and the session isn't expired

#### `token` - The Authorization token used to make API calls

#### `logEnabled` - Boolean value to enable/disable debug logging.

#### `sessionExpires` - Date when token is set to expire

#### `sessionState` - Current token/expiration session data


### HTTP Methods

Make a request to a specific API endpoint. `get`,`post`,`put`,`patch` and `delete` are helpers to set the `method` value of the main request call

#### `request(method, endpoint, data?, options?)` - Make a HTTP Request

##### Options

* `method` - HTTP Verb to use
* `endpoint` - Path for call to make. This will be relative to the `url` set in `RevClient`
* `data` - Query parameters for `get/delete` requests, Body for `put/post/patch` requests.
* `options` - Additional request parameters to pass to `fetch`.
* `options.responseType` - `json|text|blob|stream` - specify how to decode the response. Default is to autodetect based on the response. `stream` means pass through without decoding.

##### Returns

* `statusCode` - HTTP Status Code
* `headers` - Headers object
* `body` - Response payload, already decoded based on `options.responseType`
* `response` - raw `fetch` Response object

#### Throws `RevError`

Custom Error with the following additional properties:

* `status` - HTTP Status Code
* `url` - Request URL
* `code?` - Rev-specific error code
* `detail?` - Rev-specific detail message;

#### Example
```js
rev = new RevClient({ url: "https://my.rev.url", ...credentials });
await rev.request('get', '/api/v2/users/my.username', { type: 'username' });
// HTTP GET https://my.rev.url/api/v2/users/my.username?type=username
```

#### `get(endpoint, data?, options?)`
#### `post(endpoint, data?, options?)`
#### `put(endpoint, data?, options?)`
#### `patch(endpoint, data?, options?)`
#### `delete(endpoint, data?, options?)`

Make HTTP requests with the specified verb (get/post/patch/etc). Unlike `request()` these calls return the body directly.

##### Options

* `endpoint` - Path for call to make. This will be relative to the `url` set in `RevClient`
* `data` - Query parameters for `get/delete` requests, Body for `put/post/patch` requests.
* `options` - Additional request parameters to pass to `fetch`.
* `options.responseType` - `json|text|blob|stream` - specify how to decode the response. Default is to autodetect based on the response. `stream` means pass through without decoding.

##### Returns

The Response payload, already decoded based on `options.responseType`

## Rate Limits

See the [Vbrick documentation](https://revdocs.vbrick.com/reference/rate-limiting) for information on Rate Limit behavior.

If you have multiple users / agents using the Public API for a Vbrick account then you may need to set lower rate limits. These values are set Per Minute, so `30` means "30 calls per minute".

```js
// example using default options
const rev = new RevClient({
	url: 'https://my.rev.url',
	apiKey: 'key', secret: 'secret',
	rateLimits: {
		get: 24000,
		post: 3600,
		searchVideos: 120,
		videoDetails: 2000,
		uploadVideo: 30,
		auditEndpoint: 60,
		updateVideo: 30,
		loginReport: 10,
		attendeesRealtime: 2
	}
	// rateLimits: true // equivalent option
});
```

For background usage you may consider using lower values to ensure the service doesn't impact other
agents using the API:
```js

// example of overriding the limits for a service account that makes background requests
const rev = new RevClient({
	url: 'https://my.rev.url',
	apiKey: 'key', secret: 'secret',
	rateLimits: {
		searchVideos: 10, // only make 10 search calls per minute
		videoDetails: 100, 
		// other values use default
	}
})

```

## API Endpoints

`RevClient` also wraps API functionality into separate namespaces. They mostly follow the [API Documentation](https://revdocs.vbrick.com/reference) categorization.

### [Admin](https://revdocs.vbrick.com/reference/administration)

#### `admin.roles()`
#### `admin.getRoleByName(name)` - Get a specific Role `{ id: string, name: string }` based on the Role's name (i.e. 'Media Viewer')
#### `admin.customFields()`
#### `admin.getCustomFieldByName(name)` - Get a specific Custom Field based on the Custom Field's name
#### `admin.webcastRegistrationFields()`
#### `admin.createWebcastRegistrationField(field)`
#### `admin.updateWebcastRegistrationField(fieldId, field)`
#### `admin.deleteWebcastRegistrationField(fieldId)`
#### `admin.brandingSettings()`
#### `admin.listIQCreditsUsage(query, options)`
#### `admin.verifySystemHealth()`
#### `admin.maintenanceSchedule()`
#### `admin.userLocationService()`
#### `admin.expirationRules()`
#### `admin.featureSettings(videoId?)`

### [Audit](https://revdocs.vbrick.com/reference/audit)

#### `audit.accountAccess(accountId, options?)`
#### `audit.accountUsers(accountId, options?)`
#### `audit.accountGroups(accountId, options?)`
#### `audit.accountDevices(accountId, options?)`
#### `audit.accountVideos(accountId, options?)`
#### `audit.accountWebcasts(accountId, options?)`
#### `audit.userAccess(userId, accountId, options?)`
#### `audit.user(userId, accountId, options?)`
#### `audit.group(groupId, accountId, options?)`
#### `audit.device(deviceId, accountId, options?)`
#### `audit.video(videoId, accountId, options?)`
#### `audit.webcast(eventId, accountId, options?)`
#### `audit.principal(userId, accountId, options?)`

### [Authentication](https://revdocs.vbrick.com/reference/authentication)

These calls are called automatically by the `RevClient` instance, but they're included here for completeness.

#### `auth.extendSession()` - extend any kind of active session, regardless of login method
#### `auth.verifySession()` - throws error if session is not currently valid
#### `auth.loginToken(apiKey, secret)`
#### `auth.extendSessionToken(apiKey)` - **DEPRECATED**
#### `auth.logoffToken(apiKey)`
#### `auth.loginUser(username, password)`
#### `auth.logoffUser(userId)`
#### `auth.extendSessionUser(userId)` - **DEPRECATED**
#### `auth.logoffUser(userId)`
#### `auth.logoffToken(apiKey)`
#### `auth.buildOAuth2Authentication(config, state?)` - returns `Promise<{ url, codeVerifier }>`. Sign and format an OAuth2 Authorication URL. Make sure to store the codeVerifier for making a call to get an Access Token.
#### `auth.loginOAuth2(config, code, codeVerifier)` 
#### `auth.buildOAuthAuthenticateURL(config, state?)` - returns `Promise<string>`. **DEPRECATED** Sign and format an OAuth Authorization URL *(for browser login flow)*
#### `auth.parseOAuthRedirectResponse(url)` - **DEPRECATED** Synchronous, returns `{ isSuccess, authCode, state, error}` based on returned information
#### `auth.loginOAuth(config, authCode)` - **DEPRECATED** 
#### `auth.extendSessionOAuth(config, refreshToken)` - **DEPRECATED** 

### [Categories](https://revdocs.vbrick.com/reference/getcategories)

#### `category.create(category)`
#### `category.details(categoryId)`
#### `category.update(categoryId, category)`
#### `category.delete(categoryId)`
#### `category.list(parentCategoryId?, includeAllDescendants?)`
#### `category.listAssignable()`

### [Channels](https://revdocs.vbrick.com/reference/getchannel)

#### `channel.create(channel)`
#### `channel.update(channelId, channel)`
#### `channel.delete(channelId)`
#### `channel.list(start?, options?)`
#### `channel.addMembers(channelId, members)`
#### `channel.removeMembers(channelId, members)`
#### `channel.search(searchText?, {type?, assignable?})`

Wrapper around the [Search Users,Groups and Channels](https://revdocs.vbrick.com/reference/searchaccessentity) API. If `options.assignable: true` then restrict to only assignable entities. `options.type` defaults to `Channel` to just return channels

### [Devices](https://revdocs.vbrick.com/reference/devices)

#### `device.listDMEs()`
#### `device.listZoneDevices()`
#### `device.listPresentationProfiles()`
#### `device.add(dme)`
#### `device.healthStatus(deviceId)`
#### `device.delete(deviceId)`
#### `device.rebootDME(deviceId)`

### [Environment]

#### `environment.getAccountId()`
#### `environment.getRevVersion()`
#### `environment.getUserLocalIp(timeoutMilliseconds)`
Wrapper around the Use the [Get User Location Service](https://revdocs.vbrick.com/reference/user-location) to get a user's IP Address for zoning purposes.

### [Groups](https://revdocs.vbrick.com/reference/creategroup)

#### `group.create(group)`
#### `group.delete(groupId)`
#### `group.search(searchText, options?)`

**NOTE:** The response from this endpoint is remapped from the raw API results - it returns camelCase instead of PascalCase (`{id: string, name: string, entityType: string }` instead of `{Id: string, Name: string, EntityType: string}`

#### `group.list(options?)`
#### `group.listUsers(groupId, options?)`
#### `group.listUserDetails(groupId, options?)`

### [Playlists](https://revdocs.vbrick.com/reference/getplaylists)

#### `playlist.create(name, videoIds)`
#### `playlist.update(playlistId, actions)`
#### `playlist.updateFeatured(actions)`
#### `playlist.delete(playlistId)`
#### `playlist.list()`

### [Recording](https://revdocs.vbrick.com/reference/startrecording)

#### `recording.startVideoConferenceRecording(sipAddress, sipPin, title?)`
#### `recording.getVideoConferenceStatus(videoId)`
#### `recording.stopVideoConferenceRecording(videoId)`
#### `recording.startPresentationProfileRecording(request)`
#### `recording.getPresentationProfileStatus(recordingId)`
#### `recording.stopPresentationProfileRecording(recordingId)`

### Upload

##### Shared Options

All upload functions take in a `file` argument and an `options` argument.

* `file`:  `string`, `stream.Readable` or `Blob` if using node.js. `File` if browser. If `string` *(and using node.js)* then treat as a file path and load the file from disk.
* `options`:
  * Any `fetch` options *(most importantly `signal` for passing in an `AbortSignal`)*
  * `filename?`: `string` - the filename used in the `Content-Disposition` field header.
  * `contentType?`: `string` - the content type of the file
  * `contentLength?`: `number` - the known content length of the file. This is rarely needed, but can be used if passing along a HTTP Stream
  * `useChunkedTransfer?`: `boolean` - tell upload to not calculate a content length automatically, and just send as `Transfer-Encoding: chunked`

**Note:** Rev expects the file extension and content-type to agree. This library will attempt to automatically fix the filename/content-type as needed.

#### `upload.chapters(videoId, chapters, action?, options?)`

##### Options

* `videoId`: string, videoId of the video in question
* `chapters`: array of Chapter objects. At least one of `title` or `imageFile` must be specified
  * `time`: *(required)* `string`
  * `title`: `string`
  * `imageFile`: `string`, `stream.Readable` or `Blob` if using node.js. `File` if browser. See `file` in the Shared Options section above.
* `action`: One of two string values (default: `replace`):
  * `"append"`: [Update Video Chapters](https://revdocs.vbrick.com/reference/uploadvideochaptersupdate))
  * `"replace"`: [Upload Video Chapters](https://revdocs.vbrick.com/reference/uploadvideochapters)
* `options`: Additional `fetch` options

#### `upload.presentationChapters(videoId, file, options?)`
#### `upload.supplementalFile(videoId, file, options?)`
#### `upload.transcription(videoId, file, language?, options?)`
#### `upload.thumbnail(videoId, file, options?)`

#### `upload.video(file, metadata, options?)` - Upload a video

##### Options
* `file`: `string`, `stream.Readable` or `Blob` if using node.js. `File` if browser. See `file` in the Shared Options section above.
* `metadata`: Video metadata - see [API docs](https://revdocs.vbrick.com/reference/uploadvideo). Note that at minimum `uploader` MUST be included.
* `options`: See Shared Options section above.

##### Returns

The ID of the video

#### `upload.transcription(videoId, file, language?, options?)` - Upload a transcription / close captions file

### [Users](https://revdocs.vbrick.com/reference/users-groups)

#### `user.roles()`
#### `user.create(user)`
#### `user.delete(userId)`
#### `user.details(userId)`
#### `user.getByUsername(username)`
#### `user.getByEmail(email)`
#### `user.addToGroup(userId, groupId)` - Add a user to the specified Group
#### `user.removeFromGroup(userId, groupId)` - Remove a user from the specified Group
#### `user.suspend(userId)` - Use Patch API to suspend user
#### `user.unsuspend(userId)` - Use Patch API to unsuspend user
#### `user.search(searchText, options?)`

**NOTE:** The response from this endpoint is remapped from the raw API results - it returns camelCase instead of PascalCase (`{userId: string, firstname: string, profileImageUri: string, entityType: string }` instead of `{Id: string, FirstName: string, ProfileImageUri: string, EntityType: string}`. See [the typescript interface](./src/types/user.ts#23) for details.

**NOTE:** set `options.assignable` to `true` to use the "Search assignable Users/Groups/Channels" instead of searching for all users

#### `user.listSubscriptions()`
#### `user.subscribe(id, type)`
#### `user.unsubscribe(id, type)`
#### `user.getNotifications(unread?)`
#### `user.markNotificationRead(notificationId?)`
#### `user.loginReport(sortField?, sortOrder?)`

### [Videos](https://revdocs.vbrick.com/reference/videos)

#### `video.setTitle(videoId, title)` - Use PATCH API to change a video's title
#### `video.status(videoId)`
#### `video.details(videoId)`
#### `video.upload(file, metadata, options?)` - alias to `upload.video()`
#### `video.playbackInfo(videoId)` - Get Playback Url *(basic info about video)*
#### `video.playbackUrls(videoId, options?, requestOptions?)`
#### `video.comments(videoId)`
#### `video.chapters(videoId)`
#### `video.supplementalFiles(videoId)`
#### `video.transcriptions(videoId)`
#### `video.migrate(videoId, migratePayload)`
#### `video.download(videoId, options?)`
#### `video.downloadTranscription(videoId, language)`
#### `video.downloadSupplemental(videoId, fileId)`
#### `video.downloadChapter(chapter)`
#### `video.downloadThumbnail(query)`
#### `video.listExternalAccess(videoId, searchText?, searchOptions?)` - Get External Access
#### `video.createExternalAccess(videoId, {emails, message?, noEmail?})` - Add External Access
#### `video.renewExternalAccess(videoId, {emails, noEmail?})`
#### `video.deleteExternalAccess(videoId, {emails})`
#### `video.revokeExternalAccess(videoId, {emails})`
#### `video.waitTranscode(videoId, options?)` - wait for a video to finish transcoding
#### `video.trim(videoId, removedSegments)`
#### `video.convertDualStreamToSwitched(videoId)`
#### `video.patch(videoId, operations)`
#### `video.report({ videoIds?, startDate?, endDate?, sortDirection? })` - Get Video Report

**NOTE:** The API only allows searching for 12 months of data at a time. This wrapper function will split up the requests to allow for a larger range of days.

#### `video.uniqueSessionsReport(videoId, { userId?, startDate?, endDate?, sortDirection? })`

#### `video.search(query?, options?)` - Search for videos

##### Options
* `query`: See [API Docs](https://revdocs.vbrick.com/reference/searchvideo) for available search options
* `options`: Optional, Additional options for request
* `options.maxResults`: number, set the maximum number of results to return.
* `options.onProgress`: `(items: <array>, current, total) => void` - callback for each time a page is queried from Rev.
* `options.onScrollExpired`: `(err: ScrollError) => void` - Search results use a scrollID cursor that expires after 1-5 minutes from first request. If the scrollID expires then onScrollExpired will be called with a ScrollError. Default behavior is to throw the error.

##### Returns - class `SearchRequest`

This method returns a `SearchRequest` object, that includes the following methods:

* `.exec()` - Get all results as an array
* `.nextPage()` - `{ current, total, items, done }` - Get the search results one page at a time
* `[async iterator]` - The class also implements `AsyncIterator`, so can be used as a `Stream` or using `for await`

##### Examples

```js
// get the 10 most recent videos that match 'puppy' in the tags/keywords field
const request = rev.video.search({ q: 'puppies', searchField: 'tags', sortField: 'whenUploaded', sortDirection: 'desc' }, { maxResults: 10 });
const results = await request.exec();

// get ALL videos in the account and report their title, reporting progress and ignoring errors
const request = rev.video.search(undefined, {
	onProgress(items, current, total) {
		console.log(`PROGRESS: ${current}-${current + items.length} of ${total}`);
	},
	onScrollExpired(err) {
		console.warn('Error while getting video results, ignoring: ', err);
	}
});
for await (let video of request) {
	console.log(`Video ${video.id}: ${video.title} | duration: ${video.duration}`);
}
```

### [Webcasts](https://revdocs.vbrick.com/reference/webcasts)

#### `webcast.list(options?)`
#### `webcast.search(query, options?)`
#### `webcast.create(event)`
#### `webcast.details(eventId)`
#### `webcast.edit(eventId, event)`
#### `webcast.delete(eventId)`
#### `webcast.editAccess(eventId, entities)`
#### `webcast.attendees(eventId, runNumber?, options?)`
#### `webcast.questions(eventId, runNumber?)`
#### `webcast.pollResults(eventId, runNumber?)`
#### `webcast.comments(eventId, runNumber?)`
#### `webcast.status(eventId)`
#### `webcast.isPublic(eventId)` - returns `true`/`false`
#### `webcast.playbackUrls(eventId, options?, requestOptions?)`
#### `webcast.playbackUrl(eventId, options?)` **DEPRECATED** - use `webcast.playbackUrls`
#### `webcast.startEvent(eventId, preProduction?)`
#### `webcast.stopEvent(eventId, preProduction?)`
#### `webcast.startBroadcast(eventId)`
#### `webcast.stopBroadcast(eventId)`
#### `webcast.startRecord(eventId)`
#### `webcast.stopRecord(eventId)`
#### `webcast.linkVideo(eventId, videoId, autoRedirect?)`
#### `webcast.unlinkVideo(eventId)`

#### `webcast.guestRegistration(eventId, registrationId)`
#### `webcast.createGuestRegistration(eventId, registration)`
#### `webcast.updateGuestRegistration(eventId, registrationId, registration)`
#### `webcast.patchGuestRegistration(eventId, registrationId, registration)`
#### `webcast.deleteGuestRegistration(eventId, registrationId)`
#### `webcast.listGuestRegistrations(eventId, query, options)`

### [Zones](https://revdocs.vbrick.com/reference/getzones)

#### `zones.list()`
#### `zones.flatList()`
#### `zones.create(zone)`
#### `zones.edit(zoneId, zone)`
#### `zones.delete(zoneId)`
#### `zones.devices()`

### Utilities

The library exposes some additional utilities:

#### `utils.rateLimit(fn: async function, options)` or `rateLimit(options)`

The Rev API includes rate limiting for some API endpoints. If you exceed the limit then you'll receive a `429` error response. This function can help to automatically avoid that threshold.

See the [API Documentation on Rate Limiting](https://revdocs.vbrick.com/reference/rate-limiting) for current limits.

##### Options

* `fn`: function to be rate-limited
* `options`:
  * `fn`: function to be rate-limited *(if not set as first argument)*
  * `perSecond`: set limit to `X` executions **per second**
  * `perMinute`: set limit to `X` executions **per minute**
  * `perHour`: set limit to `X` executions **per hour**
  * `limit`: allow `limit` executions per `interval` milliseconds
  * `interval`: allow `limit` executions per `interval` milliseconds
  * `signal`: `AbortSignal` to cancel all pending executions.

##### Returns

Wrapped function with same arguments as passed in `fn`, with added:

* `.abort()` - cancel all pending executions

##### Example

```js
import { RevClient, rateLimit } from '@vbrick/rev-client';
const rev = new RevClient(options);

// assumes this tool is only tool in the account using API uploads
const throttledUpload = rateLimit({
	fn: (...args) => rev.upload.video(...args),
	perMinute: 30
});

const numberOfVideos = 100;
for (let i = 0; i < numberOfVideos; i++) {
	// same arguments as rev.upload.video
	const videoId = await throttledUpload(file, {title: `video ${i}`, uploader: `my.username` });
}
```

#### `utils.getExtensionForMime(contentType, defaultExtension?)`

Get the expected extension for a mime-type supported by Rev for upload. If none found it will return the `defaultExtension` *(or `.mp4` if none specified)*

#### `utils.getMimeForExtension(extension?, defaultType?)`

Get the expected mime-type for the specified extension (`.ext`). If none found it will return the `defaultType` *(or `video/mp4` if none specified)*

### Error Classes

### `RevError`

Custom error returned for error status code responses

#### Properties

* `status`: `number` - http status code
* `url`: `string` - original URL of request
* `code`: `string` - Rev-specified error string, for example `MalformedRequest`, `RequiredFieldMissing` or `InvalidFileType`
* `detail`: `string` - Additional details about error (if passed).

### `ScrollError`

Custom error returned if a paged search request has expired `(usually because more than 1 minute has passed between requests for more pages of data)`



---

## Disclaimer
This code is distributed "as is", with no warranty expressed or implied, and no guarantee for accuracy or applicability to your purpose.
