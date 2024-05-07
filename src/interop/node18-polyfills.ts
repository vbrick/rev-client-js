import fs from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { ReadableStream } from 'node:stream/web';
import { createHmac, randomBytes, createHash } from 'crypto';
import { isBlobLike, isReadable } from '../utils';
import type { FileUploadPayloadInternal } from '../utils/file-utils';
import type { Rev } from '../types/rev';
import polyfills from '.';

async function getLengthFromStream(source: Record<string, any>) {
    const {
        length,
        contentLength,
        headers = { },
        path: filepath
    } = source;

    if (isFinite(length)) {
        return length;
    }
    if (isFinite(contentLength)) {
        return contentLength;
    }
    // a HTTP Response object
    if (headers?.['content-length']) {
        const headerLength = parseInt(headers['content-length'], 10);
        if (isFinite(headerLength)) {
            return headerLength;
        }
    }

    // try to get size from a fs stream's path parameter
    if (filepath) {
        // sanity check 15 sec timeout
        const TIMEOUT_MS = 15 * 1000;
        let timer;
        const timeout = new Promise<fs.Stats>(done => { timer = setTimeout(done, TIMEOUT_MS, { }); });
        try {
            const stat = await Promise.race([fs.promises.stat(filepath), timeout]);
            if (stat?.size) {
                return stat.size;
            }
        } catch (err) {
            // ignore
        } finally {
            clearTimeout(timer);
        }
    }
}


/**
 * For node.js support this allows uploading videos based on filename or from a readable stream
 */
async function parseFileUpload(file: Rev.FileUploadType, options: Rev.UploadFileOptions): Promise<FileUploadPayloadInternal> {
    let {
        filename,
        contentType,
        contentLength,
        useChunkedTransfer
    } = options;

    // only try to get length if not already specified, or useChunkedTransfer is set
    const shouldUpdateLength = !(contentLength || useChunkedTransfer);

    if (typeof file === 'string') {
        if (!filename) {
            filename = path.basename(file);
        }
        file = fs.createReadStream(file);

        // get stats from disk
        if (shouldUpdateLength) {
            contentLength = await getLengthFromStream(file);
        }
    } else if (isBlobLike(file)) {
        const { type, name, size } = <File>file;
        if (type && !contentType) {
            contentType = type;
        }
        if (name && !filename) {
            filename = name;
        }
        if (shouldUpdateLength) {
            contentLength = size;
        }
    } else if (isReadable(file)) {
        if (!filename) {
            const { path: _path, filename: _filename, name: _name } = file as Record<string, any>;
            // try to get filename from stream
            const streamPath = _path || _filename || _name;
            if (streamPath && typeof streamPath === 'string') {
                filename = path.basename(streamPath);
            }
        }
        // try to get length from stream
        if (shouldUpdateLength) {
            contentLength = await getLengthFromStream(file);
        }
    }

    return {
        file,
        options: {
            ...options,
            filename,
            contentType,
            contentLength
        }
    };
}
async function appendFileToForm(form: FormData, fieldName: string, payload: FileUploadPayloadInternal) {
    const {
        file,
        options: {
            filename
        }
    } = payload;

    form.append(fieldName, file as any, filename);
}

async function prepareUploadHeaders(form: FormData, headers: Headers, useChunkedTransfer: boolean = false) {
    if (useChunkedTransfer) {
        headers.set('transfer-encoding', 'chunked');
        headers.delete('content-length');
    }
}

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


Object.assign(polyfills, {
    AbortController,
    AbortSignal,
    createAbortError(message: string): Error { return new AbortError(message); },
    fetch: (...args: Parameters<typeof fetch>) => fetch(...args),
    FormData,
    Headers,
    Request,
    Response,
    randomValues,
    sha256Hash,
    hmacSign,
    appendFileToForm,
    parseFileUpload,
    prepareUploadHeaders,
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

