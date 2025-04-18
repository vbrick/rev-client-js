import * as api from './api';
import polyfills, { onInitialize, shouldInitialize } from './interop/polyfills';
import { RevError } from './rev-error';
import { createSession } from './rev-session';
import type { Rev } from './types';
import { RateLimitEnum, isPlainObject, retry } from './utils';
import { decodeBody } from './utils/request-utils';

/**
 * @categoryDescription Getting Started
 * @see {@link RevClient}, the main entry point for using this library
 */

/** @inline */
type PayloadType = { [key: string]: any; } | Record<string, any> | any[];

/**
 * All API interactions are wrapped up in the `RevClient` class.
 *
 * @example
 * ```js
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

    // get details of current user
    const currentUser = await rev.user.details('me');
    console.log(currentUser);
});
```
 *
 * @category Getting Started
 *
 * @groupDescription APIs
 * Methods to call the Rev APIs  are broken up into namespaces.
 * They roughly match up to the categories in the [Rev API Docs](https://revdocs.vbrick.com/reference/developer-hub)
 * Documentation for the individual api namespaces are broken out into separate pages:
 * * `.admin`: {@link AdminAPI | admin api}
 *
 * * **`.admin`**: {@link AdminAPI | Admin Methods}
 * * **`.audit`**: {@link AuditAPI | Audit Methods}
 * * **`.auth`**: {@link AuthAPI | Auth Methods}
 * * **`.category`**: {@link CategoryAPI | Category Methods}
 * * **`.channel`**: {@link ChannelAPI | Channel Methods}
 * * **`.device`**: {@link DeviceAPI | Device Methods}
 * * **`.environment`**: {@link EnvironmentAPI | Environment Methods}
 * * **`.group`**: {@link GroupAPI | Group Methods}
 * * **`.playlist`**: {@link PlaylistAPI | Playlist Methods}
 * * **`.recording`**: {@link RecordingAPI | Recording Methods}
 * * **`.upload`**: {@link UploadAPI | Upload Methods}
 * * **`.user`**: {@link UserAPI | User Methods}
 * * **`.video`**: {@link VideoAPI | Video Methods}
 * * **`.webcast`**: {@link WebcastAPI | Webcast Methods}
 * * **`.zones`**: {@link ZoneAPI | Zone Methods}
 *
 *
 * @groupDescription Session
 * Methods to maintain the authentication session (accessToken)
 *
 * @groupDescription Request
 * Methods to directly make (authenticated) HTTP requests
 *
 * @groupDescription Properties
 * instance properties
 *
 * @groupDescription Internal
 * for internal use
 *
 */
export class RevClient {
    /**
     * The Rev tenant url (i.e. https://my.rev.url)
     * @group Properties
     */
    url: string;
    /**
     * turns on/off debug logging to console
     * @group Internal
     */
    logEnabled: boolean;
    /**
     ** This is an internal class that handles authentication and maintaining the session. It should not be used directly.
     * @group Internal
     */
    session: Rev.IRevSession;
    /**
     * @group APIs
     */
    readonly admin!: api.AdminAPI;
    /**
     * @group APIs
     */
    readonly audit!: api.AuditAPI;
    /**
     * @group APIs
     */
    readonly auth!: api.AuthAPI;
    /**
     * @group APIs
     */
    readonly category!: api.CategoryAPI;
    /**
     * @group APIs
     */
    readonly channel!: api.ChannelAPI;
    /**
     * @group APIs
     */
    readonly device!: api.DeviceAPI;
    /**
     * @group APIs
     */
    readonly environment!: api.EnvironmentAPI;
    /**
     * @group APIs
     */
    readonly group!: api.GroupAPI;
    /**
     * @group APIs
     */
    readonly playlist!: api.PlaylistAPI;
    /**
     *
     * @group APIs
     */
    readonly recording!: api.RecordingAPI;
    /**
     * @group APIs
     */
    readonly upload!: api.UploadAPI;
    /**
     * @group APIs
     */
    readonly user!: api.UserAPI;
    /**
     * @group APIs
     */
    readonly video!: api.VideoAPI;
    /**
     * @group APIs
     */
    readonly webcast!: api.WebcastAPI;
    /**
     * @group APIs
     */
    readonly zones!: api.ZoneAPI;
    /**
     * @internal
     */
    private _streamPreference: Rev.RequestOptions['responseType'];
    /**
     *
     * @param options The configuration options including target Rev URL and authentication credentials
     */
    constructor(options: Rev.Options) {
        if (!isPlainObject(options) || !options.url) {
            throw new TypeError('Missing configuration options for client - url and username/password or apiKey/secret');
        }
        const {
            url,
            log,
            logEnabled = false,
            keepAlive = true,
            // NOTE default to false rate limiting for now. In future this may change
            rateLimits = false,
            defaultStreamPreference = 'stream',
            ...credentials
        } = options;

        // get just the origin of provided url
        const urlObj = new URL(url);
        this.url = urlObj.origin;

        // will throw error if credentials are invalid
        this.session = createSession(this, credentials, keepAlive, rateLimits);

        // add logging functionality
        this.logEnabled = !!logEnabled;
        if (log) {
            this.log = (severity: Rev.LogSeverity, ...args: any[]) => {
                if (!this.logEnabled) {
                    return;
                }
                log(severity, ...args);
            };
        }
        this._streamPreference = defaultStreamPreference;

        // add all API endpoints
        Object.defineProperties(this, {
            admin: { value: api.admin(this), writable: false },
            // NOTE rate limiting option passed into api factory since its
            audit: { value: api.audit(this, rateLimits), writable: false },
            auth: { value: api.auth(this), writable: false },
            category: { value: api.category(this), writable: false },
            channel: { value: api.channel(this), writable: false },
            device: { value: api.device(this), writable: false },
            environment: { value: api.environment(this), writable: false },
            group: { value: api.group(this), writable: false },
            playlist: { value: api.playlist(this), writable: false },
            recording: { value: api.recording(this), writable: false },
            upload: { value: api.upload(this), writable: false },
            user: { value: api.user(this), writable: false },
            video: { value: api.video(this), writable: false },
            webcast: { value: api.webcast(this), writable: false },
            // COMBAK - DEPRECATED
            webcasts: { get: () => {
                this.log('debug', 'webcasts is deprecated - use rev.webcast instead');
                return this.webcast;
            }, enumerable: false },
            zones: { value: api.zones(this), writable: false }
        });
    }
    /**
     * make a REST request.
     * The Authorization http header for the current session will automatically be added.
     *
     * @group Request
     * @param method HTTP Method
     * @param endpoint API endpoint path
     * @param data Request body if PUT/POST/PATCH or query parameters object if GET/DELETE/HEAD. objects/arrays are automatically stringified
     * @param options additional request options, including additional HTTP Headers if necessary.
     * @returns the decoded response body as well as statuscode/headers/and raw response
     *
     */
    async request<T = any>(method: Rev.HTTPMethod, endpoint: string, data: any = undefined, options: Rev.RequestOptions = { }): Promise<Rev.Response<T>> {
        // support for dynamically loading fetch polyfill
        if (shouldInitialize()) await onInitialize();

        const url = new URL(endpoint, this.url);
        // ensure url matches Rev url, to avoid sending authorization header elsewhere
        if (url.origin !== this.url) {
            throw new TypeError(`Invalid endpoint - must be relative to ${this.url}`);
        }

        let {
            headers: optHeaders,
            responseType,
            throwHttpErrors = true,
            ...requestOpts
        } = options;

        // setup headers for JSON communication (by default)
        const headers = new polyfills.Headers(optHeaders);

        // add authorization header from stored token
        if (this.session.token && !headers.has('Authorization')) {
            headers.set('Authorization', `VBrick ${this.session.token}`);
        }
        if (headers.get('Authorization') === '') {
            // if Auth is explicitly set to '' then remove from list
            headers.delete('Authorization');
        }

        const fetchOptions: RequestInit = {
            mode: 'cors',
            method,
            ...requestOpts,
            headers
        };

        // default to JSON request payload, but allow it to be overridden
        let shouldSetAsJSON = !headers.has('Content-Type');
        const normalizedMethod = method.toUpperCase();

        // add provided data to request body or as query string parameters
        if (data) {
            if (['POST', 'PUT', 'PATCH'].includes(normalizedMethod)) {
                if (typeof data === 'string') {
                    fetchOptions.body = data;
                } else if (data instanceof polyfills.FormData) {
                    shouldSetAsJSON = false;
                    fetchOptions.body = data;
                } else if (isPlainObject(data) || Array.isArray(data)) {
                    fetchOptions.body = JSON.stringify(data);
                } else {
                    fetchOptions.body = data;
                }
            } else if (isPlainObject(data)) {
                // add values to query string of URL
                for (let [key, value] of Object.entries(data)) {
                    if (value instanceof Date) value = value.toISOString();
                    url.searchParams.append(key, value);
                }
            } else {
                throw new TypeError(`Invalid payload for request to ${method} ${endpoint}`);
            }
        }

        // default to JSON communication
        if (!headers.has('Accept')) {
            headers.set('Accept', 'application/json');
        }
        // set to JSON payload
        if (shouldSetAsJSON && fetchOptions.body) {
            headers.set('Content-Type', 'application/json');
        }

        // OPTIONAL log request and response
        this.log('debug', `Request ${method} ${endpoint}`);

        if (this.session.hasRateLimits) {
            switch (normalizedMethod) {
                case 'GET':
                    await this.session.queueRequest(RateLimitEnum.Get);
                    break;
                case 'POST':
                case 'PATCH':
                case 'PUT':
                case 'DELETE':
                    await this.session.queueRequest(RateLimitEnum.Post);
                    break;
            }
        }

        // NOTE: will throw error on AbortError or client fetch errors
        const response = await polyfills.fetch(`${url}`, {
            ...fetchOptions,
            method,
            headers
        });

        const {
            ok,
            status: statusCode,
            statusText,
            headers: responseHeaders
        } = response;

        // check for error response code
        if (!ok) {
            if (throwHttpErrors) {
                const err = await RevError.create(response);
                this.log('debug', `Response ${method} ${endpoint} ${statusCode} ${err.code || statusText}`);
                throw err;
            }
            // if not throwwing then force responseType to auto (could be text or json)
            responseType = undefined;
        }

        this.log('debug', `Response ${method} ${endpoint} ${statusCode} ${statusText}`);

        let body: any = response.body;

        switch (responseType) {
            case 'json':
                // safety check for empty response
                if (`${responseHeaders.get('content-length')}` === '0') {
                    body = null;
                } else {
                    body = await response.json();
                }
                break;
            case 'text':
                body = await response.text();
                break;
            case 'blob':
                body = await response.blob();
                break;
            case 'stream':
                switch (this._streamPreference) {
                    case 'webstream': body = polyfills.asWebStream(response.body); break;
                    case 'nativestream': body = polyfills.asPlatformStream(response.body); break;
                    default: body = response.body;
                }
                body = response.body;
                break;
            case 'webstream':
                body = polyfills.asWebStream(response.body);
                break;
            case 'nativestream':
                body = polyfills.asPlatformStream(response.body);
                break;
            default:
                // if no mimetype in response then assume JSON unless otherwise specified
                body = await decodeBody(response, headers.get('Accept'));
        }

        return {
            statusCode,
            headers: responseHeaders,
            body,
            response
        };
    }
    /**
     *
     * Make a GET Request
     * @group Request
     * @param endpoint API path
     * @param data Query parameters as json object
     * @param options Additional request options
     * @returns Depends on options.responseType/API response - usually JSON object except for binary download endpoints
     */
    async get<T = any>(endpoint: string, data?: PayloadType, options?: Rev.RequestOptions): Promise<T> {
        const { body } = await this.request('GET', endpoint, data, options);
        return body;
    }
    /**
     *
     * Make a POST Request
     * @group Request
     * @param endpoint API path
     * @param data Request body
     * @param options Additional request options
     * @returns Depends on options.responseType/API response - usually JSON object
     */
    async post<T = any>(endpoint: string, data?: PayloadType, options?: Rev.RequestOptions): Promise<T> {
        const { body } = await this.request('POST', endpoint, data, options);
        return body;
    }
    /**
     *
     * Make a GET Request
     * @group Request
     * @param endpoint API path
     * @param data Request body
     * @param options Additional request options
     * @returns Depends on options.responseType/API response - usually JSON object or void
     */
    async put<T = any>(endpoint: string, data?: PayloadType, options?: Rev.RequestOptions): Promise<T> {
        const { body } = await this.request('PUT', endpoint, data, options);
        return body;
    }
    /**
     *
     * Make a PATCH Request
     * @group Request
     * @param endpoint API path
     * @param data Request body
     * @param options Additional request options
     * @returns
     */
    async patch(endpoint: string, data?: PayloadType, options?: Rev.RequestOptions): Promise<void> {
        await this.request('PATCH', endpoint, data, options);
    }
    /**
     *
     * Make a DELETE Request
     * @group Request
     * @param endpoint API path
     * @param data query parameters as JSON object
     * @param options Additional request options
     * @returns
     */
    async delete(endpoint: string, data?: PayloadType, options?: Rev.RequestOptions): Promise<void> {
        await this.request('DELETE', endpoint, data, options);
    }
    /**
     *
     * authenticate with Rev
     * @group Session
     */
    async connect() {

        // Rarely the login call will fail on first attempt, therefore this code attempts to login
        // multiple times
        await retry(
            () => this.session.login(),
            // Do not re-attempt logins with invalid user/password or rate limiting - it can lock out the user
            (err: RevError) => ![401, 429].includes(err.status));
    }
    /**
     *
     * end rev session
     * @group Session
     */
    async disconnect() {
        try {
            await this.session.logoff();
        } catch (error) {
            this.log('warn', `Error in logoff, ignoring: ${error}`);
        }
    }
    /**
     *
     * Call the Extend Session API to maintain the current session's expiration time
     * Note that this API call is automatically handled unless `keepAlive: false` was specified in configuring the client.
     * @group Session
     */
    async extendSession() {
        return this.session.extend();
    }
    /**
     *
     * Returns true/false based on if the session is currently valid
     * @group Session
     * @returns Promise<boolean>
     */
    async verifySession() {
        return this.session.verify();
    }
    /**
     *
     * Returns true if session is connected and token's expiration date is in the future
     * @group Properties
     */
    get isConnected() {
        return this.session.isConnected;
    }
    /**
     *
     * the current session's `accessToken`
     * @group Properties
     */
    get token() {
        return this.session.token;
    }
    /**
     *
     * `Date` value when current `accessToken` will expire
     * @group Properties
     */
    get sessionExpires() {
        return this.session.expires;
    }
    /**
     *
     * get/set serialized session state (accessToken, expiration, and userId/apiKey)
     * Useful if you need to create a new RevClient instance with the same accessToken
     * @group Properties
     */
    get sessionState() {
        return this.session.toJSON();
    }
    /**
     *
     * get/set serialized session state (accessToken, expiration, and userId/apiKey)
     * Useful if you need to create a new RevClient instance with the same accessToken
     * @group Properties
     */
    set sessionState(state: Rev.IRevSessionState) {
        this.session.token = `${state.token}`;
        this.session.expires = new Date(state.expiration);
        for (let key of ['apiKey', 'refreshToken', 'userId'] as (keyof Rev.IRevSessionState)[]) {
            if (key in state) {
                (this.session as any)[key] = `${state[key] || ''}`;
            }
        }
    }
    /**
     *
     * used internally to write debug log entries. Does nothing if `logEnabled` is `false`
     * @group Internal
     * @param severity
     * @param args
     * @returns
     */
    log(severity: Rev.LogSeverity, ...args: any[]) {
        if (!this.logEnabled) {
            return;
        }

        const ts = (new Date()).toJSON().replace('T', ' ').slice(0, -5);
        console.debug(`${ts} REV-CLIENT [${severity}]`, ...args);
    }
}
