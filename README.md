# Vbrick Rev Client Library (beta)

This is a javascript client library for interacting with the [Vbrick Rev API](https://revdocs.vbrick.com/reference). It should work in node.js 14+, evergreen browsers (i.e. not IE), and deno.

This library is intended for use with **[VBrick Rev](https://vbrick.com)**.

## Installation

#### Browser/deno
The compiled library is at `dist/rev-client.js`.

#### Node.js (v14+) 
```sh
npm install @vbrick/rev-client
```

## Compatibility

* **Browser** - This library is in ESM module format - it assumes use of an evergreen browser that has `fetch`, `AbortController`, etc.
* **node.js** - Node.js 14 or above required. It will work with commonjs (`require`) or ES Module (`import`) projects.
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
* `logEnabled`: `true`/`false` *(Default: `false`)* - Enable/disable debug logging
* `log`: `(logLevel, ...args) => void` - Custom log function. Default is to log to console

And **one** of following login options (`apiKey`+`secret`, `username`+`password` or `oauthConfig`):

1. User API Key:

   * `apiKey`: User API Key of Rev User
   * `secret`: User Secret of Rev User

2. Username/Password login:

   * `username`: Username of Rev user.
   * `password`: Password of Rev user.

3. OAuth session *(**NOTE**: This is for OAuth 2.0 browser-redirect flow to create sessions, it's not intended for server-side only login)*
     
* `oauthConfig`: OAuth configuration object
* `oauthConfig.oauthApiKey`: API key from Rev Admin -> Security. This is a DIFFERENT value from the User Token used for API login/extend session
* `oauthConfig.oauthSecret`: API secret from Rev Admin -> Security. This is a DIFFERENT value from a user's `secret`
* `oauthConfig.redirectUri`: The local URL Rev should redirect user to after logging in. This must match EXACTLY what's specified in Rev Admin -> Security for the specified API key

### RevClient session methods:


#### `connect()` - Login to Rev using configured credentials

#### `disconnect()` - Logoff from Rev and clear token

#### `extendSession()` - Extend current session token

#### `verifySession()` - Returns true/false on if the current token is valid

#### `isConnected` - Boolean value that indicates if `connect()` has been called and the session isn't expired

#### `token` - The Authorization token used to make API calls

#### `logEnabled` - Boolean value to enable/disable debug logging.

#### `sessionExpires` - Date when token is set to expire


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


## API Endpoints

`RevClient` also wraps API functionality into separate namespaces. They mostly follow the [API Documentation](https://revdocs.vbrick.com/reference) categorization.

### [Admin](https://revdocs.vbrick.com/reference/administration)

#### `admin.roles()`
#### `admin.getRoleByName(name)` - Get a specific Role `{ id: string, name: string }` based on the Role's name (i.e. 'Media Viewer')
#### `admin.customFields()`
#### `admin.getCustomFieldByName(name)` - Get a specific Custom Field based on the Custom Field's name
#### `admin.brandingSettings()`
#### `admin.verifySystemHealth()`
#### `admin.maintenanceSchedule()`

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

#### `auth.loginToken(apiKey, secret)`
#### `auth.extendSessionToken(apiKey)`
#### `auth.logoffToken(apiKey)`
#### `auth.loginUser(username, password)`
#### `auth.logoffUser(userId)`
#### `auth.extendSessionUser(userId)`
#### `auth.verifySession()`
#### `auth.logoffUser(userId)`
#### `auth.logoffToken(apiKey)`
#### `auth.buildOAuthAuthenticateURL(config, state?)` - returns `Promise<string>`. Sign and format an OAuth Authorization URL *(for browser login flow)*
#### `auth.parseOAuthRedirectResponse(url)` - Synchronous, returns `{ isSuccess, authCode, state, error}` based on returned information
#### `auth.loginOAuth(config, authCode)`
#### `auth.extendSessionOAuth(config, refreshToken)`

### [Categories](https://revdocs.vbrick.com/reference/getcategories)

#### `category.create(category)`
#### `category.details(categoryId)`
#### `category.update(categoryId, category)`
#### `category.delete(categoryId)`
#### `category.list(parentCategoryId?, includeAllDescendants?)`

### [Channels](https://revdocs.vbrick.com/reference/getchannel)

#### `channel.create(channel)`
#### `channel.update(channelId, channel)`
#### `channel.delete(channelId)`
#### `channel.list(start?, options?)`
#### `channel.addMembers(channelId, members)`
#### `channel.removeMembers(channelId, members)`

### [Devices](https://revdocs.vbrick.com/reference/devices)

#### `device.listDMEs()`
#### `device.listZoneDevices()`
#### `device.listPresentationProfiles()`
#### `device.add(dme)`
#### `device.healthStatus(deviceId)`
#### `device.delete(deviceId)`

### [Groups](https://revdocs.vbrick.com/reference/creategroup)

#### `group.create(group)`
#### `group.delete(groupId)`
#### `group.search(searchText, options?)`
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

#### `upload.transcription(videoId, file, language?, options?)`
#### `upload.video(file, metadata, options?)` - Upload a video

##### Options
* `file`: string, `stream.Readable` or `Blob` if using node.js. `File` if browser.
* `metadata`: Video metadata - see [API docs](https://revdocs.vbrick.com/reference/uploadvideo)
* `options`: Additional `fetch` options

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
#### `user.search(searchText, options?)`

### [Videos](https://revdocs.vbrick.com/reference/videos)

#### `video.setTitle(videoId, title)` - Use PATCH API to change a video's title
#### `video.status(videoId)`
#### `video.details(videoId)`
#### `video.upload(file, metadata, options?)` - alias to `upload.video()`
#### `video.playbackInfo(videoId)`
#### `video.comments(videoId)`
#### `video.chapters(videoId)`
#### `video.supplementalFiles(videoId)`
#### `video.transcriptions(videoId)`
#### `video.migrate(videoId, options)`
#### `video.download(videoId)`
#### `video.downloadTranscription(videoId, language)`
#### `video.downloadSupplemental(videoId, fileId)`
#### `video.downloadChapter(chapter)`
#### `video.downloadThumbnail(query)`
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

#### `webcasts.list(options?)`
#### `webcasts.search(query, options?)`
#### `webcasts.create(event)`
#### `webcasts.details(eventId)`
#### `webcasts.edit(eventId, event)`
#### `webcasts.delete(eventId)`
#### `webcasts.editAccess(eventId, entities)`
#### `webcasts.attendees(eventId, runNumber?, options?)`
#### `webcasts.questions(eventId, runNumber?)`
#### `webcasts.pollResults(eventId, runNumber?)`
#### `webcasts.comments(eventId, runNumber?)`
#### `webcasts.status(eventId)`
#### `webcasts.playbackUrl(eventId, options?)`
#### `webcasts.startEvent(eventId, preProduction?)`
#### `webcasts.stopEvent(eventId, preProduction?)`
#### `webcasts.startBroadcast(eventId)`
#### `webcasts.stopBroadcast(eventId)`
#### `webcasts.startRecord(eventId)`
#### `webcasts.stopRecord(eventId)`
#### `webcasts.linkVideo(eventId, videoId, autoRedirect?)`
#### `webcasts.unlinkVideo(eventId)`

### [Zones](https://revdocs.vbrick.com/reference/getzones)

#### `zones.list()`
#### `zones.flatList()`
#### `zones.create(zone)`
#### `zones.edit(zoneId, zone)`
#### `zones.delete(zoneId)`
#### `zones.zoneDevices()`

---

## Disclaimer
This code is distributed "as is", with no warranty expressed or implied, and no guarantee for accuracy or applicability to your purpose.
