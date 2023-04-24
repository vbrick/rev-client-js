import { isPlainObject, tryParseJson } from './utils';

export class RevError extends Error {
    status: number;
    url: string;
    code: string;
    detail: string;
    constructor(response: Response, body: { [key: string]: any; } | string) {
        const {
            status = 500,
            statusText = '',
            url
        } = response;
        super(`${status} ${statusText}`);
        // Chrome/node specific function
        if ('captureStackTrace' in Error) {
            (Error as any).captureStackTrace(this, this.constructor);
        }

        this.status = status;
        this.url = url;
        this.code = `${status}`;
        this.detail = statusText;
        // Some Rev API responses include additional details in its body
        if (isPlainObject<Record<string, string>>(body)) {
            if (body.code) {
                this.code = body.code;
            }
            if (body.detail) {
                this.detail = body.detail;
            }
        } else if (typeof body === 'string') {
            body = body.trim();
            // try to parse as JSON
            if (body.startsWith('{')) {
                const { code, detail } = tryParseJson(body) || { };
                if (code) { this.code = code; }
                if (detail) { this.detail = detail; }
            } else if (this.status === 429) {
                this.detail = 'Too Many Requests';
            } else if (/^(<!DOCTYPE|<html)/.test(body)) {
                // if html then strip out the extra cruft
                this.detail = body
                    .replace(/.*<body>\s+/s, '')
                    .replace(/<\/body>.*/s, '')
                    .slice(0, 256);
            }
        }
    }
    get name() {
        return this.constructor.name;
    }
    get [Symbol.toStringTag]() {
        return this.constructor.name;
    }
    static async create(response: Response) {
        let body: any;

        try {
            // retrieve body - constructor will decode as json
            body = await response.text();
        } catch (err) {
            body = {
                code: 'Unknown',
                detail: `Unable to parse error response body: ${err}`
            };
        }
        return new RevError(response, body);
    }
}

export class ScrollError extends Error {
    status: number;
    code: string;
    detail: string;
    constructor(status: number = 408, code: string = 'ScrollExpired', detail: string = 'Timeout while fetching all results in search request') {
        super('Search Scroll Expired');
        Error.captureStackTrace(this, this.constructor);
        this.status = status;
        this.code = code;
        this.detail = detail;
    }
    get name() {
        return this.constructor.name;
    }
    get [Symbol.toStringTag]() {
        return this.constructor.name;
    }
}
