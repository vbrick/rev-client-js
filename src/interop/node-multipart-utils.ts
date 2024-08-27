import type { FileLike } from "form-data-encoder";
import { Stats, createReadStream, promises as fs } from "node:fs";
import path from "node:path";
import { Readable } from 'node:stream';
import { ReadableStream } from "node:stream/web";
import { Rev } from "../types/rev";
import { isBlobLike } from "../utils";
import { sanitizeUploadOptions } from "../utils/file-utils";

export const uploadParser = {
    async string(value: string, options: Rev.UploadFileOptions) {
        const input = createReadStream(value);
        return uploadParser.stream(input, {
            filename: path.basename(value),
            ...options
        });
    },
    async blob(value: Blob | File, options: Rev.UploadFileOptions) {
        let {
            filename = getFilename(value),
            contentType,
            contentLength,
            useChunkedTransfer = false,
            defaultContentType
        } = options;

        const sanitized = sanitizeUploadOptions(filename, contentType, defaultContentType);

        if (value.type !== sanitized.contentType && typeof value.slice === 'function') {
            value = new File([value], sanitized.filename, { type: sanitized.contentType });
        }
        return {
            file: value,
            options: {
                ...options,
                ...value.size && { contentLength: value.size },
                ...sanitized
            }
        };
    },
    async stream(value: AsyncIterable<Uint8Array>, options: Rev.UploadFileOptions, defaultContentType?: string) {
        let {
            filename = getFilename(value),
            contentType,
            contentLength,
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
    async parse(value: Rev.FileUploadType, options: Rev.UploadFileOptions) {
        if (typeof value === 'string') {
            return uploadParser.string(value, options);
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
        return statFile(filepath, timeoutSeconds);
    }
}

export async function statFile(filepath: string, timeoutSeconds = 15) {
    // sanity check timeout
    let timer;
    const timeout = new Promise<Stats>(done => {
        timer = setTimeout(done, timeoutSeconds * 1000, { });
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
