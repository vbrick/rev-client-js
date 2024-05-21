import type { RevClient } from './rev-client';
import type { Rev } from './types';
import { isPlainObject, sleep } from './utils';
import interop from './interop';
import { RateLimitEnum, RateLimitQueues, clearQueues, makeQueues } from './utils/rate-limit-queues';

const ONE_MINUTE = 1000 * 60;

// obsfucate credentials to avoid accidental disclosure
const _credentials = Symbol('credentials');

interface LoginResponse {
    token: string,
    expiration: string,
    userId?: string,
    refreshToken?: string,
    apiKey?: string;
}

class SessionKeepAlive {
    private readonly _session!: SessionBase;
    private controller?: AbortController;
    extendOptions: Required<Rev.KeepAliveOptions>;
    error?: undefined | Error;
    private _isExtending: boolean = false;
    constructor(session: SessionBase, options: Rev.KeepAliveOptions = { }) {
        // TODO verify values?
        this.extendOptions = {
            extendThresholdMilliseconds: 3 * ONE_MINUTE,
            keepAliveInterval: 10 * ONE_MINUTE,
            verify: true,
            ...options
        };

        Object.defineProperties(this, {
            _session: {
                get: () => session,
                enumerable: false
            }
        });
    }
    getNextExtendTime() {
        const { expires } = this._session;
        if (!expires) {
            return 0;
        }
        const {
            keepAliveInterval: interval,
            extendThresholdMilliseconds: threshold
        } = this.extendOptions;

        const timeTillExpiration = expires.getTime() - Date.now();
        // clamp range to within 0 and max interval
        return Math.max(0, Math.min(timeTillExpiration - threshold, interval));
    }
    private async _poll() {
        const { _session: session } = this;
        // force stop other poll process if already polling
        // keep reference to controller in case of reset
        const controller = this._reset();
        const { signal } = controller;

        while (session.isConnected && !signal.aborted) {
            const nextExtendTime = this.getNextExtendTime();
            await sleep(nextExtendTime, signal);

            // check if poll was aborted. if so don't try to extend
            if (signal.aborted) {
                break;
            }

            // extend session
            // possible this can throw an error
            try {
                // extending may re-login, so pause poll resets for now
                this._isExtending = true;
                await session.lazyExtend(this.extendOptions);
            } catch (err: any) {
                // swallow error, but signal stopped using abort controller
                controller.abort();
                this.error = err;
            } finally {
                this._isExtending = false;
            }
        }
    }
    start() {
        if (this._isExtending) {
            return;
        }
        this._poll();
    }
    stop() {
        if (this._isExtending) {
            return;
        }
        if (this.controller) {
            this.controller.abort();
        }
    }
    private _reset() {
        this.error = undefined;
        this._isExtending = false;
        const oldController = this.controller;
        this.controller = new interop.AbortController();

        // stop previous poll
        if (oldController) {
            oldController.abort();
        }
        return this.controller;
    }
    get isAlive() {
        return this.controller && !this.controller.signal.aborted;
    }
}

abstract class SessionBase implements Rev.IRevSession {
    token?: string;
    expires: Date;
    protected readonly rev!: RevClient;
    protected readonly [_credentials]!: Rev.Credentials;
    readonly keepAlive?: SessionKeepAlive;
    readonly _rateLimits?: Partial<RateLimitQueues>;
    constructor(rev: RevClient, credentials: Rev.Credentials, keepAliveOptions?: boolean | Rev.KeepAliveOptions, rateLimits?: boolean | Rev.RateLimits) {
        this.expires = new Date();

        if (keepAliveOptions === true) {
            this.keepAlive = new SessionKeepAlive(this);
        } else if (isPlainObject(keepAliveOptions)) {
            this.keepAlive = new SessionKeepAlive(this, keepAliveOptions);
        }

        let rateLimitQueues: undefined | Partial<RateLimitQueues> = undefined;
        if (rateLimits) {
            rateLimitQueues = makeQueues(isPlainObject(rateLimits) ? rateLimits : undefined);
        }

        // add as private member
        Object.defineProperties(this, {
            rev: {
                get() { return rev; },
                enumerable: false
            },
            [_credentials]: {
                get() { return credentials; },
                enumerable: false
            },
            _rateLimits: {
                get() { return rateLimitQueues; },
                enumerable: false
            }
        });
    }
    async login() {
        this.token = undefined;
        this.expires = new Date();

        const {
            expiration,
            ...session
        } = await this._login();

        Object.assign(this, session);

        const expires = new Date(expiration);
        // VERY edge case where old date could be returned - just assume 10 min expiration
        if (expires.getTime() < this.expires.getTime()) {
            this.expires.setUTCMinutes(this.expires.getUTCMinutes() + 10);
        } else {
            this.expires = expires;
        }

        if (this.keepAlive) {
            this.keepAlive.start();
        }
    }
    async extend() {
        const { expiration } = await this._extend();
        this.expires = new Date(expiration);
    }
    async logoff() {
        if (this.keepAlive) {
            this.keepAlive.stop();
        }
        try {
            await this._logoff();
        } finally {
            this.token = undefined;
            this.expires = new Date();
        }
    }
    async verify() {
        try {
            await this.rev.auth.verifySession();
            return true;
        } catch (err) {
            return false;
        }
    }
    /**
     *
     * @returns wasExtended - whether session was extended / re-logged in
     */
    async lazyExtend(options: Rev.KeepAliveOptions = { }) {
        const {
            extendThresholdMilliseconds: threshold = 3 * ONE_MINUTE,
            verify: shouldVerify = true
        } = options;

        const { expires } = this;
        const timeLeft = expires
            ? expires.getTime() - Date.now()
            : -1;

        // login if session expired
        if (timeLeft <= 0) {
            await this.login();
            return true;
        }

        // extend if within extend window
        if (timeLeft > threshold) {
            try {
                await this.extend();
                // successful extend, nothing more to do
                return true;
            } catch (error) {
                this.rev.log('warn', 'Error extending session - re-logging in', error);
            }
            // check if valid session if plenty of time left
        } else if (!shouldVerify || await this.verify()) {
            // valid, no change
            return false;
        }

        // if reached here then need to re-login
        await this.login();
        return true;
    }
    async queueRequest(queue: `${RateLimitEnum}`) {
        await this._rateLimits?.[queue]?.();
    }
    /**
     * Abort pending executions. All unresolved promises are rejected with a `AbortError` error.
     * @param {string} [message] - message parameter for rejected AbortError
     */
    async clearQueues(message?: string) {
        await clearQueues(this._rateLimits ?? {}, message);
    }
    /**
     * check if expiration time of session has passed
     */
    get isExpired() {
        const { expires } = this;
        if (!expires) {
            return true;
        }
        return Date.now() > expires.getTime();
    }
    /**
     * returns true if session isn't expired and has a token
     */
    get isConnected() {
        return !!this.token && !this.isExpired;
    }
    get username() {
        return this[_credentials].username;
    }
    get hasRateLimits() {
        return !!this._rateLimits;
    }
    protected abstract _login(): Promise<LoginResponse>;
    protected abstract _extend(): Promise<{ expiration: string; }>;
    protected abstract _logoff(): Promise<void>;
    public abstract toJSON(): Rev.IRevSessionState;
}

/**
 * Use OAuth2Session instead if possible
 * @deprecated
 */
export class OAuthSession extends SessionBase {
    refreshToken?: string;
    async _login() {
        const { oauthConfig, authCode } = this[_credentials];
        if (!oauthConfig || !authCode) {
            throw new TypeError('OAuth Config / auth code not specified');
        }
        const {
            accessToken: token,
            expiration,
            refreshToken,
            userId
        } = await this.rev.auth.loginOAuth(oauthConfig, authCode);
        return { token, expiration, refreshToken, userId };
    }
    async _extend() {
        const { [_credentials]: { oauthConfig } } = this;

        const {
            // other API calls call this "token" instead of "accessToken", hence the rename
            accessToken: token,
            expiration,
            refreshToken
        } = await this.rev.auth.extendSessionOAuth(oauthConfig as any, <string>this.refreshToken);

        // unlike other extend methods this updates the token + refreshToken each time
        Object.assign(this, { token, refreshToken });
        return { expiration };
    }
    async _logoff() {
        // nothing to do
        return;
    }
    public toJSON(): Rev.IRevSessionState {
        return {
            token: this.token || '',
            expiration: this.expires,
            refreshToken: this.refreshToken
        };
    }
}

export class OAuth2Session extends SessionBase {
    refreshToken?: string;
    async _login() {
        const { oauthConfig, code, codeVerifier } = this[_credentials];
        if (!oauthConfig || !code || !codeVerifier) {
            throw new TypeError('OAuth Config / auth code / verifier not specified');
        }
        const {
            access_token: token,
            expires_in,
            refresh_token: refreshToken,
            userId
        } = await this.rev.auth.loginOAuth2(oauthConfig, code, codeVerifier);
        const expiresTime = Date.now() + parseInt(expires_in, 10) * 1000;
        const expiration = new Date(expiresTime).toISOString();
        return { token, expiration, refreshToken, userId };
    }
    async _extend() {
        return this.rev.auth.extendSession();
    }
    async _logoff() {
        return;
    }
    public toJSON(): Rev.IRevSessionState {
        return {
            token: this.token || '',
            expiration: this.expires
        };
    }
}

export class UserSession extends SessionBase {
    userId?: string;
    async _login() {
        const { username, password } = this[_credentials];
        if (!username || !password) {
            throw new TypeError('username/password not specified');
        }
        const {
            token,
            expiration,
            id: userId
        } = await this.rev.auth.loginUser(username, password);
        return { token, expiration, userId };
    }
    async _extend() {
        const { userId } = this;

        return this.rev.auth.extendSessionUser(<string>userId);
    }
    async _logoff() {
        const { userId } = this;

        return this.rev.auth.logoffUser(<string>userId);
    }
    public toJSON(): Rev.IRevSessionState {
        return {
            token: this.token || '',
            expiration: this.expires,
            userId: this.userId
        };
    }
}

export class ApiKeySession extends SessionBase {
    async _login() {
        const { apiKey, secret } = this[_credentials];
        if (!apiKey || !secret) {
            throw new TypeError('apiKey/secret not specified');
        }
        return this.rev.auth.loginToken(apiKey, secret);
    }
    async _extend() {
        const { apiKey } = this[_credentials];
        return this.rev.auth.extendSessionToken(<string>apiKey);
    }
    async _logoff() {
        const { apiKey } = this[_credentials];
        return this.rev.auth.logoffToken(<string>apiKey);
    }
    public toJSON(): Rev.IRevSessionState {
        return {
            token: this.token || '',
            expiration: this.expires,
            apiKey: this[_credentials].apiKey
        };
    }
}

export class JWTSession extends SessionBase {
    async _login() {
        const { jwtToken } = this[_credentials];
        if (!jwtToken) {
            throw new TypeError('JWT Token not specified');
        }
        const {accessToken: token, expiration} = await this.rev.auth.loginJWT(jwtToken);
        return { token, expiration, issuer: 'vbrick' };
    }
    async _extend() {
        return this.rev.auth.extendSession();
    }
    async _logoff() {
        return;
    }
    public toJSON(): Rev.IRevSessionState {
        return {
            token: this.token || '',
            expiration: this.expires
        };
    }
}

export class GuestRegistrationSession extends SessionBase {
    async _login() {
        const { webcastId, guestRegistrationToken } = this[_credentials];
        if (!guestRegistrationToken || !webcastId) {
            throw new TypeError('Guest Registration Token or Webcast ID not specified');
        }
        const {accessToken: token} = await this.rev.auth.loginGuestRegistration(webcastId, guestRegistrationToken);

        // expires time is not sent, so just assume 15 minutes
        const expiresTime = Date.now() + 1000 * 60 * 15;
        const expiration = new Date(expiresTime).toISOString();

        return { token, expiration, issuer: 'vbrick' };
    }
    async _extend() {
        return this.rev.auth.extendSession();
    }
    async _logoff() {
        return;
    }
    public toJSON(): Rev.IRevSessionState {
        return {
            token: this.token || '',
            expiration: this.expires
        };
    }
}

export class AccessTokenSession extends SessionBase {
    // just verify user on login
    async _login() {
        await this.rev.auth.verifySession();
        return {
            token: this.token || '',
            expiration: this.expires?.toISOString(),
            issuer: 'vbrick'
        };
    }
    async _extend() {
        return this.rev.auth.extendSession();
    }
    async _logoff() {
        return;
    }
    public toJSON(): Rev.IRevSessionState {
        return {
            token: this.token || '',
            expiration: this.expires
        };
    }
    get isConnected() {
        return true;
    }
    get isExpired() {
        return false;
    }
}

export class PublicOnlySession extends SessionBase {
    async _login() {
        this.rev.log('debug', 'Using client with no authentication (publicOnly) - non-public endpoints will return 401');
        // no verify
        return {
            token: this.token || '',
            // very long expiration
            expiration: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            issuer: 'vbrick'
        };
    }
    async _extend() {
        return {
            expiration: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        }
    }
    async _logoff() {
        return;
    }
    public toJSON(): Rev.IRevSessionState {
        return {
            token: this.token || '',
            expiration: this.expires
        };
    }
}

export function createSession(rev: RevClient, credentials: Rev.Credentials, keepAliveOptions?: boolean | Rev.KeepAliveOptions, rateLimits?: boolean | Rev.RateLimits) {
    let session: Rev.IRevSession;

    const {
        session: sessionState = {} as Rev.IRevSessionState,
        publicOnly,
        ...creds
    } = credentials;

    const {
        token,
        expiration,
        refreshToken,
        userId
    } = sessionState;

    const now = Date.now();
    const expires = new Date(expiration || now);
    const hasSession = (token && typeof token === 'string') && (expires.getTime() > now);

    const isOAuth2Login = credentials.oauthConfig && (credentials.code && credentials.codeVerifier);
    const isLegacyOauthLogin = credentials.oauthConfig && (credentials.authCode || (hasSession && refreshToken));
    const isApiKeyLogin = credentials.apiKey && (credentials.secret || (hasSession && !userId));
    const isUsernameLogin = credentials.username && (credentials.password || (hasSession && userId));
    const isJWTLogin = credentials.jwtToken;
    const isGuestRegistration = credentials.webcastId && credentials.guestRegistrationToken;

    // prefer oauth first, then apikey then username if multiple params specified
    if (isOAuth2Login) {
        session = new OAuth2Session(rev, creds, keepAliveOptions, rateLimits);
    } else if (isLegacyOauthLogin) {
        session = new OAuthSession(rev, creds, keepAliveOptions, rateLimits);
        if (refreshToken) {
            (session as OAuthSession).refreshToken = refreshToken;
        }
    } else if (isApiKeyLogin) {
        session = new ApiKeySession(rev, creds, keepAliveOptions, rateLimits);
    } else if (isJWTLogin) {
        session = new JWTSession(rev, creds, keepAliveOptions, rateLimits);
    } else if (isGuestRegistration) {
        session = new GuestRegistrationSession(rev, creds, keepAliveOptions, rateLimits);
    } else if (isUsernameLogin) {
        session = new UserSession(rev, creds, keepAliveOptions, rateLimits);
        if (userId) {
            (session as UserSession).userId = userId;
        }
    } else if (hasSession || publicOnly) {
        session = new AccessTokenSession(rev, creds, keepAliveOptions, rateLimits);
    } else {
        throw new TypeError('Must specify credentials (username+password, apiKey+secret or oauthConfig+authCode)');
    }

    if (hasSession) {
        session.token = token;
        session.expires = expires;
    }
    return session;
}
