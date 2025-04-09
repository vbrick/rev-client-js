import { FormDataEncoder } from 'form-data-encoder';
import { FormData } from 'node-fetch';
import { createHash, createHmac, randomBytes } from 'node:crypto';
import { Readable } from 'node:stream';
import { ReadableStream } from 'node:stream/web';
import type { RequestInit } from 'undici-types';
import type { Rev } from '../types/rev';
import { uploadParser } from './node-multipart-utils';
import type { RevPolyfills } from './polyfills';
import { pathToFileURL } from 'node:url';

function randomValues(byteLength: number) {
    return randomBytes(byteLength).toString('base64url');
}

/**
 * sha256 hash function for oauth2 pkce
 * @param value
 * @returns
 */
async function sha256Hash(value: string) {
    return createHash('sha256')
        .update(value)
        .digest()
        .toString('base64url');
}

async function hmacSign(message: string, secret: string) {
    const hmac = createHmac('sha256', secret);
    const signature = hmac.update(message).digest('base64');
    return signature;
}

class AbortError extends Error {
    type: string = 'aborted';
    code: number = 20;
    ABORT_ERR: number = 20;
    constructor(message?: string) {
        super(message);
        Error.captureStackTrace(this, this.constructor);
    }
    get name() {
        return this.constructor.name;
    }
    get [Symbol.toStringTag]() {
        return this.constructor.name;
    }
}

export default (polyfills: RevPolyfills) => {
    Object.assign(polyfills, {
        createAbortError(message: string): Error { return new AbortError(message); },
        fetch(...args: Parameters<typeof fetch>) {
            return globalThis.fetch(...args)
                .catch(err => {
                    // node.js native fetch (undici) wraps undelying errors in TypeError
                    // unwrapping to maintain compatibility with node-fetch and Deno behaviors
                    if (err instanceof TypeError && err.cause instanceof Error) {
                        throw err.cause;
                    }
                    throw err;
                });
        },
        FormData,
        randomValues,
        sha256Hash,
        hmacSign,
        parseUrl(value: string | URL) {
            return value instanceof URL
                ? value
                : URL.canParse(value) && !/^[a-z]:[\\\/]/i.test(value)
                ? new URL(value)
                : pathToFileURL(value);
        },
        uploadParser,
        beforeFileUploadRequest(form: FormData, headers: Headers, uploadOptions: Rev.UploadFileOptions, options: Rev.RequestOptions) {
            /** Encodes formdata as stream, rather than use builtin formdata processing - this is to allow streaming upload files without having to load into memory first */
            const encoder = new FormDataEncoder(form);

            Object.assign(options, {
                body: encoder,
                // needed for undici error thrown when body is stream
                // https://fetch.spec.whatwg.org/#dom-requestinit-duplex
                duplex: 'half'
            } as RequestInit);

            // set content-type and possibly content-length from form encoder
            for (let [key, value] of Object.entries(encoder.headers)) {
                headers.set(key, value);
            }
            headers.delete('transfer-encoding');
            return undefined;
        },
        asPlatformStream(stream: NodeJS.ReadableStream | Readable | ReadableStream<any>): NodeJS.ReadableStream {
            if (!stream) return stream;
            return (stream instanceof ReadableStream)
                ? Readable.fromWeb(stream)
                : stream;
        },
        asWebStream(stream: NodeJS.ReadableStream | Readable | ReadableStream<any>): ReadableStream {
            return (!stream || (stream instanceof ReadableStream))
                ? stream
                : Readable.toWeb(Readable.from(stream));
        }
    });
};
