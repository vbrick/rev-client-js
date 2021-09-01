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

    export interface RequestOptions extends Partial<RequestInit> {
        /**
         * specify body type when decoding. Use 'stream' to skip parsing body completely
         */
        responseType?: 'json' | 'text' | 'blob' | 'stream';
    }
    export interface SearchOptions<T> {
        /**
         * maximum number of search results
         */
        maxResults?: number;
        /**
         * callback per page
         */
        onPage?: (items: T[], index: number, total: number) => void;
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
}
