import { RevError, ScrollError } from '..';
import { OAuth } from './auth';

export type LiteralString<T> = T | (string & { _?: never; });

type FetchResponse = Response;

export namespace Rev {
    // HTTP Method for requests
    export type HTTPMethod = LiteralString<'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD'>;
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
        /** authCode from oauth authorization flow */
        authCode?: string;
        /** oauth configuration values for oauth token management */
        oauthConfig?: OAuth.Config;
        /** existing token/extend session details */
        session?: Rev.IRevSessionState;
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
    }

    export interface IRevSession {
        token?: string;
        expires: Date;
        readonly isExpired: boolean;
        readonly username: string | undefined;
        login(): Promise<void>;
        extend(): Promise<void>;
        logoff(): Promise<void>;
        verify(): Promise<boolean>;
        lazyExtend(options?: Rev.KeepAliveOptions): Promise<boolean>;
        toJSON(): Rev.IRevSessionState;
    }

    export interface RequestOptions extends Partial<RequestInit> {
        /**
         * specify body type when decoding. Use 'stream' to skip parsing body completely
         */
        responseType?: 'json' | 'text' | 'blob' | 'stream';
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
    }

    export interface SearchDefinition<T = any, RawType = any> {
        endpoint: string,
        totalKey: string,
        hitsKey: string,
        isPost?: boolean;
        request?: (endpoint: string, query?: Record<string, any>, options?: RequestOptions) => Promise<Record<string, any>>;
        transform: (items: RawType[]) => T[] | Promise<T[]>;
    }

    export interface KeepAliveOptions {
        /**
         * How many milliseconds between automatic extend session calls
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
}
