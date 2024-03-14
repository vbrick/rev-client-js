import { RevError } from './rev-error';
import { RateLimitEnum, isPlainObject, retry } from './utils';
import * as api from './api';
import polyfills from './interop';
import { Rev } from './types';
import { decodeBody } from './utils/request-utils';
import { createSession } from './rev-session';

type PayloadType = { [key: string]: any; } | Record<string, any> | any[];

export class RevClient {
    url: string;
    logEnabled: boolean;
    session: Rev.IRevSession;
    readonly admin!: ReturnType<typeof api.admin>;
    readonly audit!: ReturnType<typeof api.audit>;
    readonly auth!: ReturnType<typeof api.auth>;
    readonly category!: ReturnType<typeof api.category>;
    readonly channel!: ReturnType<typeof api.channel>;
    readonly device!: ReturnType<typeof api.device>;
    readonly environment!: ReturnType<typeof api.environment>;
    readonly group!: ReturnType<typeof api.group>;
    readonly playlist!: ReturnType<typeof api.playlist>;
    readonly recording!: ReturnType<typeof api.recording>;
    readonly upload!: ReturnType<typeof api.upload>;
    readonly user!: ReturnType<typeof api.user>;
    readonly video!: ReturnType<typeof api.video>;
    readonly webcast!: ReturnType<typeof api.webcast>;
    readonly zones!: ReturnType<typeof api.zones>;
    private _streamPreference: Rev.RequestOptions['responseType'];
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
     * make a REST request
     */
    async request<T = any>(method: Rev.HTTPMethod, endpoint: string, data: any = undefined, options: Rev.RequestOptions = { }): Promise<Rev.Response<T>> {
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
        if (shouldSetAsJSON) {
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

        this.log('debug', `Response ${method} ${endpoint} ${statusCode} ${statusText}`);

        // check for error response code
        if (!ok) {
            if (throwHttpErrors) {
                const err = await RevError.create(response);
                throw err;
            }
            // if not throwwing then force responseType to auto (could be text or json)
            responseType = undefined;
        }

        let body: any = response.body;

        switch (responseType) {
            case 'json':
                body = await response.json();
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
    async get<T = any>(endpoint: string, data?: PayloadType, options?: Rev.RequestOptions): Promise<T> {
        const { body } = await this.request('GET', endpoint, data, options);
        return body;
    }
    async post<T = any>(endpoint: string, data?: PayloadType, options?: Rev.RequestOptions): Promise<T> {
        const { body } = await this.request('POST', endpoint, data, options);
        return body;
    }
    async put<T = any>(endpoint: string, data?: PayloadType, options?: Rev.RequestOptions): Promise<T> {
        const { body } = await this.request('PUT', endpoint, data, options);
        return body;
    }
    async patch(endpoint: string, data?: PayloadType, options?: Rev.RequestOptions): Promise<void> {
        await this.request('PATCH', endpoint, data, options);
    }
    async delete(endpoint: string, data?: PayloadType, options?: Rev.RequestOptions): Promise<void> {
        await this.request('DELETE', endpoint, data, options);
    }
    /**
     * authenticate with Rev
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
     * end rev session
     */
    async disconnect() {
        try {
            await this.session.logoff();
        } catch (error) {
            this.log('warn', `Error in logoff, ignoring: ${error}`);
        }
    }
    // this should get called every 15 minutes or so to extend the connection session
    async extendSession() {
        return this.session.extend();
    }
    /**
     * Returns true/false based on if the session is currently valid
     * @returns Promise<boolean>
     */
    async verifySession() {
        return this.session.verify();
    }
    get isConnected() {
        return this.session.isConnected;
    }
    get token() {
        return this.session.token;
    }
    get sessionExpires() {
        return this.session.expires;
    }
    get sessionState() {
        return this.session.toJSON();
    }
    set sessionState(state: Rev.IRevSessionState) {
        this.session.token = `${state.token}`;
        this.session.expires = new Date(state.expiration);
        for (let key of ['apiKey', 'refreshToken', 'userId'] as (keyof Rev.IRevSessionState)[]) {
            if (key in state) {
                (this.session as any)[key] = `${state[key] || ''}`;
            }
        }
    }
    log(severity: Rev.LogSeverity, ...args: any[]) {
        if (!this.logEnabled) {
            return;
        }
        const ts = (new Date()).toJSON().replace('T', ' ').slice(0, -5);
        console.debug(`${ts} REV-CLIENT [${severity}]`, ...args);
    }
}
