import type { FileLike } from "form-data-encoder";
import { Stats, createReadStream, promises as fs } from "node:fs";
import path from "node:path";
import { Readable } from 'node:stream';
import { ReadableStream } from "node:stream/web";
import { RevError } from "../rev-error";
import type { Rev } from "../types/rev";
import { isBlobLike } from "../utils";
import { sanitizeUploadOptions } from "../utils/file-utils";
import { uploadParser as baseUploadParser } from "../utils/multipart-utils";
import polyfills from "./polyfills";
import { finished } from "node:stream/promises";

const LOCAL_PROTOCOLS = ['blob:', 'data:'];
const FETCH_PROTOCOLS = ['http:', 'https:', ...LOCAL_PROTOCOLS];

export const uploadParser = {
    async string(value: string | URL, options: Rev.UploadFileOptions) {
        const url = polyfills.parseUrl(value);

        if (options.disableExternalResources && !LOCAL_PROTOCOLS.includes(url.protocol)) {
            throw new Error(`${url.protocol} protocol not allowed`);
        }

        if (FETCH_PROTOCOLS.includes(url.protocol)) {
            return uploadParser.response(
                await polyfills.fetch(url, options),
                options
            );
        }

        return uploadParser.localFile(url, options);
    },
    async localFile(url: URL, options: Rev.UploadFileOptions) {
        // use FS reader to read files
        const readStream = createReadStream(url);
        // pass through contentType of file based on filename, even if overridden in options
        const {filename, contentType} = sanitizeUploadOptions(getFilename(url.pathname), '', options.contentType);

        return Promise.race([
            uploadParser.stream(
                readStream,
                {
                    filename,
                    ...options,
                    contentType
                }
            ),
            // will throw error if filepath cannot be accessed
            finished(readStream)
        ]);
    },
    async blob(value: Blob | File, options: Rev.UploadFileOptions) {
        return baseUploadParser.blob(value, {
            filename: getFilename(value),
            ...options
        });
    },
    async stream(value: AsyncIterable<Uint8Array> | ReadableStream<Uint8Array>, options: Rev.UploadFileOptions) {
        let {
            filename = getFilename(value),
            contentType,
            contentLength,
            defaultContentType,
            useChunkedTransfer = false
        } = options;

        const sanitized = sanitizeUploadOptions(filename, contentType, defaultContentType);

        // only try to get length if not already specified, or useChunkedTransfer is set
        if (!useChunkedTransfer) {
            contentLength ||= await getLengthFromStream(value);
        }

        const file = new FileFromStream(value, sanitized.filename, {
            type: sanitized.contentType,
            size: contentLength
        });
        return {
            file,
            options: {
                ...options,
                contentLength,
                ...sanitized
            }
        };
    },
    async response(response: Response, options: Rev.UploadFileOptions) {
        const { body, headers, url } = response;
        if (!response.ok || !body) {
            const err = await RevError.create(response);
            throw err;
        }
        let {
            contentLength,
            filename = getFilename(url)
        } = options;

        // ignore length of compressed inputs
        if (!headers.get('content-encoding')) {
            contentLength ||= parseInt(headers.get('content-length') || '') || undefined;
        }

        const contentType = headers.get('content-type');
        const opts = {
            ...options,
            filename,
            ...contentType && { contentType },
            ...(contentLength
                ? { contentLength }
                : { useChunkedTransfer: true }
            )
        }

        return uploadParser.stream(body as ReadableStream<Uint8Array>, opts);
    },
    async parse(value: Rev.FileUploadType, options: Rev.UploadFileOptions) {
        if (typeof value === 'string' || value instanceof URL) {
            return uploadParser.string(value, options);
        }
        if (value instanceof polyfills.Response) {
            return uploadParser.response(value, options);
        }
        if (isBlobLike(value) && !(value as any)[Symbol.asyncIterator]) {
            return uploadParser.blob(value, options);
        }
        return uploadParser.stream(value as AsyncIterable<any>, options);
    }
}


export class FileFromStream implements FileLike {
    #stream: Readable | ReadableStream | AsyncIterable<Uint8Array>;

    constructor(stream: Readable | ReadableStream | AsyncIterable<Uint8Array>, fileName: string = '', options?: FilePropertyBag & { size?: number, lastModified?: number }) {
        this.#stream = stream;
        this.name = fileName;
        this.type = options?.type ?? ''
        this.size = options?.size ?? NaN;
        this.lastModified = options?.lastModified ?? Date.now();
    }
    name: string;
    type: string;
    size: number;
    lastModified: number;
    stream(): ReadableStream<Uint8Array> | AsyncIterable<Uint8Array> {
        return this.#stream;
    }
    [Symbol.toStringTag] = 'File';
}


async function getLengthFromStream(source: Record<string, any>, timeoutSeconds = 15) {
    const {
        length,
        contentLength,
        headers = {},
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
        return statFile(filepath, timeoutSeconds);
    }
}

export async function statFile(filepath: string | URL, timeoutSeconds = 15) {
    // sanity check timeout
    let timer;
    const timeout = new Promise<Stats>(done => {
        timer = setTimeout(done, timeoutSeconds * 1000, {});
    });

    try {
        const stat = await Promise.race([
            fs.stat(filepath),
            timeout
        ]);

        return stat?.size;
    } catch (err) {
    } finally {
        clearTimeout(timer);
    }
}

/**
 * try to get the filename from input (filepath/File/Fs.ReadStream/Response)
 * @param file
 * @returns
 */
function getFilename(file: Rev.FileUploadType) {
    if (typeof file === 'string') {
        return path.basename(file);
    }
    const { path: _path, filename, name } = file as Record<string, any>;
    // try to get filename from stream/File
    const streamPath = _path || filename || name;
    if (streamPath && typeof streamPath === 'string') {
        return path.basename(streamPath);
    }
}
