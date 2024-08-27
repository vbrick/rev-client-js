import type { ScrollError } from '..';
import type { RateLimitEnum } from '../utils/rate-limit-queues';
import type { OAuth } from './auth';

export type LiteralString<T> = T | (string & Record<never, never>);

type FetchResponse = Response;

export namespace Rev {
    // HTTP Method for requests
    export type HTTPMethod = LiteralString<'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD'>;
    export type ResponseType = LiteralString<'json' | 'text' | 'blob' | 'stream' | 'webstream' | 'nativestream'>;
    export type PatchOperation = {
        op: 'add' | 'remove' | 'replace';
        path: string;
        value?: any;
    }
    export interface Response<T> {
        statusCode: number;
        headers: Headers;
        body: T;
        response: FetchResponse;
    }

    export interface IRevSessionState {
        token: string;
        expiration: Date | string;
        /** Required if using username login */
        userId?: string;
        /** Required if using OAuth login */
        refreshToken?: string;
        /** if using ApiKey login */
        apiKey?: string;
    }

    export interface Credentials {
        /** Username of Rev User (for login) - this or apiKey must be specified */
        username?: string;
        /** Password of Rev User (for login) - this or secret must be specified */
        password?: string;
        /** API Key forRev User (for login) - this or username must be specified */
        apiKey?: string;
        /** API Secret for Rev User (for login) - this or password must be specified */
        secret?: string;
        /** oauth configuration values for oauth token management */
        oauthConfig?: OAuth.Config;
        /** authCode from deprecated legacy oauth authorization flow */
        authCode?: string;
        /** code from oauth2 authorization flow */
        code?: string;
        /** code verifier from oauth2 authorization flow */
        codeVerifier?: string;
        /** JWT Token */
        jwtToken?: string;
        /** Webcast Guest Registration */
        guestRegistrationToken?: string;
        /** Webcast ID for Guest Registration */
        webcastId?: string;

        /** existing token/extend session details */
        session?: Rev.IRevSessionState;
        /** use public APIs only - no authentication */
        publicOnly?: boolean;
    }
    export type LogSeverity = LiteralString<'debug' | 'info' | 'warn' | 'error'>;
    export type LogFunction = (severity: LogSeverity, ...args: any[]) => void;
    export interface Options extends Credentials {
        /** URL of Rev account */
        url: string;

        /** Logging function - default is log to console */
        log?: LogFunction;

        /** Enable/disable logging */
        logEnabled?: boolean;

        /** If true then automatically extend the Rev session at regular intervals, until
         *     rev.disconnect() is called. Optionally, pass in keepAlive options instead of `true`
         */
        keepAlive?: boolean | KeepAliveOptions;

        rateLimits?: boolean | Rev.RateLimits

        /**
         * Specify the default response type for streaming responses
         * 'stream': whatever underlying library returns (NodeJS Readable for node-fetch, ReadableStream otherwise)
         * 'webstream': always return a ReadableStream
         * 'nativestream': always return native stream type (NodeJS Readable on NodeJS, ReadableStream otherwise)
         */
        defaultStreamPreference?: 'stream' | 'webstream' | 'nativestream';
    }

    export type RateLimits = { [K in RateLimitEnum]?: number }

    export interface IRevSession {
        token?: string;
        expires: Date;
        readonly isExpired: boolean;
        readonly isConnected: boolean;
        readonly hasRateLimits: boolean;
        readonly username: string | undefined;
        login(): Promise<void>;
        extend(): Promise<void>;
        logoff(): Promise<void>;
        verify(): Promise<boolean>;
        lazyExtend(options?: Rev.KeepAliveOptions): Promise<boolean>;
        toJSON(): Rev.IRevSessionState;
        queueRequest(queue: `${RateLimitEnum}`): Promise<void>;
    }

    export interface RequestOptions extends Partial<RequestInit> {
        /**
         * specify body type when decoding. Use 'stream' to skip parsing body completely
         */
        responseType?: ResponseType;
        /**
         * whether to throw errors or not for HTTP error response codes.
         * @default true
         */
        throwHttpErrors?: boolean
    }

    export interface ISearchRequest<T> extends AsyncIterable<T> {
        current: number;
        total?: number;
        done: boolean;
        nextPage(): Promise<SearchPage<T>>;
        exec(): Promise<T[]>;
    }

    export interface SearchOptions<T> {
        /**
         * maximum number of search results
         */
        maxResults?: number;
        /**
         * callback per page
         */
        onProgress?: (items: T[], current: number, total?: number | undefined) => void;
        /**
         * Search results use a scrollID cursor that expires after 1-5 minutes
         * from first request. If the scrollID expires then onScrollExpired
         * will be called with a ScrollError. Default behavior is to throw
         * the error.
         *
         * Note that request level errors (like 401 or 500) will just be thrown as normal,
         * not passed to this function
         */
        onError?: (err: Error | ScrollError) => void;
        /**
         * Use onError instead
         * @deprecated use onError instead
         */
        onScrollError?: (err: ScrollError) => void;

        signal?: AbortSignal | undefined;
    }

    export interface AccessEntitySearchOptions<T> extends SearchOptions<T> {
        // type?: LiteralString<'User' | 'Group' | 'Channel'>;
        assignable?: boolean;
        // count?: number;
        // transformResult?: boolean;
    }

    export interface SearchDefinition<T = any, RawType = any> {
        endpoint: string,
        totalKey: string,
        hitsKey: string,
        isPost?: boolean;
        request?: (endpoint: string, query?: Record<string, any>, options?: RequestOptions) => Promise<Record<string, any>>;
        transform?: (items: RawType[]) => T[] | Promise<T[]>;
    }

    export interface KeepAliveOptions {
        /**
         * How many milliseconds between automatic extend session calls
         * Default 5 minutes
         * @default 300000
         */
        keepAliveInterval?: number;
        /**
         * How many milliseconds before session is set to expire to
         *     proactively extend the session. Sane values are in the
         *     1-10 minutes range (default 3 min = 180000)
         * @default 180000
         */
        extendThresholdMilliseconds?: number;
        /**
         * If true (default) then make a verify API call to ensure
         * session has a valid session. Otherwise do nothing if
         * session has not expired (or within threshold)
         * @default true
         */
        verify?: boolean;
    }

    /**
     * Returned from scrollPageStream helper for each results page of a search endpoint
     */
    export interface SearchPage<T> {
        items: T[],
        current: number,
        total?: number,
        done: boolean
    }

    export type SortDirection = LiteralString<'asc' | 'desc'>;

    export type FileUploadType = string | File | Blob | AsyncIterable<any>;
    export interface UploadFileOptions extends Rev.RequestOptions {
        /** specify filename of video as reported to Rev */
        filename?: string;
        /** specify content type of video */
        contentType?: string;
        /** if content length is known this will avoid needing to detect it */
        contentLength?: number;
        /** node-only - bypass dealing with content length and just upload as transfer-encoding: chunked */
        useChunkedTransfer?: boolean;
        /** Default content type to use if cannot be determined from input blob/filename */
        defaultContentType?: string;
    }
}
