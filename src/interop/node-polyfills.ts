import fs from 'fs';
import path from 'path';
import { createHmac } from 'crypto';
import { promisify } from 'util';
import fetch, { Headers, Request, Response } from 'node-fetch';
import FormData, { AppendOptions } from 'form-data';
import { isBlobLike, isReadable } from '../utils';
import type { UploadFileOptions, FileUploadPayloadInternal, FileUploadType } from '../utils/file-utils';
import { AbortSignal, AbortController } from 'node-abort-controller';
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
async function parseFileUpload(file: FileUploadType, options: UploadFileOptions): Promise<FileUploadPayloadInternal> {
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
            filename,
            contentType,
            contentLength
        }
    } = payload;
    const appendOptions: AppendOptions = { filename, contentType };
    if (contentLength) {
        appendOptions.knownLength = contentLength;
    }

    form.append(fieldName, file, appendOptions);
}

async function prepareUploadHeaders(form: FormData, headers: Headers, useChunkedTransfer: boolean = false) {
    const totalBytes: number = useChunkedTransfer
        ? 0
        : await promisify(form.getLength).call(form).catch(() => 0) as number;

    if (totalBytes > 0) {
        headers.set('content-length', `${totalBytes}`);
    } else {
        headers.set('transfer-encoding', 'chunked');
        headers.delete('content-length');
        // HACK - node-fetch force attempts to get length from form-data. This is to keep it from setting the content-length header
        // form.getLengthSync = () => null;
    }
}

async function hmacSign(message: string, secret: string) {
    const hmac = createHmac('sha256', secret);
    const signature = hmac.update(message).digest('base64');
    return signature;
}

Object.assign(polyfills, {
    AbortController,
    AbortSignal,
    fetch: (...args: Parameters<typeof fetch>) => fetch(...args),
    FormData,
    Headers,
    Request,
    Response,
    hmacSign,
    appendFileToForm,
    parseFileUpload,
    prepareUploadHeaders
});

