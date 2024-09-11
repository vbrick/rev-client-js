import polyfills from '../interop/polyfills';
import type { RevClient } from '../rev-client';
import { RevError } from '../rev-error';
import type { Rev } from '../types';
import { sanitizeUploadOptions } from './file-utils';
import { isBlobLike } from './is-utils';

export const uploadParser = {
    async string(value: string | URL, options: Rev.UploadFileOptions) {
        const url = value instanceof URL
            ? value
            : new URL(value, 'invalid://');

        if (!/^data|blob|file/.test(url.protocol)) {
            throw new TypeError('Only Blob / DateURI URLs are supported');
        }
        if (options.disableExternalResources && url.protocol === 'file:') {
            throw new Error('file: protocol not allowed');
        }
        const file = await (await polyfills.fetch(url)).blob();
        return uploadParser.blob(file, options)
    },
    async stream(value: AsyncIterable<Uint8Array>, options: Rev.UploadFileOptions) {
        const {contentType} = options;
        // allow web streams only
        if (!(value instanceof ReadableStream)) {
            throw new TypeError('Only Blob / Files are supported for file uploads. Pass a File/Blob object');
        }
        // FormData doesn't support readable streams unfortunately, so read to blob
        const response = new Response(value, {
            headers: contentType ? { 'content-type': contentType } : {}
        });
        return uploadParser.response(response, options);
    },
    async response(response: Response, options: Rev.UploadFileOptions) {
        const { body, headers } = response;
        if (!response.ok || !body) {
            const err = await RevError.create(response);
            throw err;
        }
        return uploadParser.blob(
            await response.blob(),
            options
        );
    },
    async blob(value: Blob | File, options: Rev.UploadFileOptions) {
        let {
            filename = (value as File).name ?? 'upload',
            contentType = value.type ?? '',
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
    async parse(value: Rev.FileUploadType, options: Rev.UploadFileOptions) {
        if (typeof value === 'string' || value instanceof URL) {
            return uploadParser.string(value, options);
        }
        if (value instanceof polyfills.Response) {
            return uploadParser.response(value, options);
        }
        if (!isBlobLike(value)) {
            throw new TypeError('Only Blob / Files are supported for file uploads. Pass a File/Blob object');
        }
        return uploadParser.blob(value, options);
    }
}


export function appendJSONToForm(form: FormData, fieldName: string, data: any) {
    form.append(fieldName, JSON.stringify(data));
}
/**
 * This method is included for isometric support of uploading files in node.js and browser.
 * @param form FormData instance
 * @param fieldName name of field to add to form
 * @param file the file. Can be Blob or File on browser. On node.js it can be anything the 'form-data' package will accept
 * @param options optional filename, contentType and contentLength of upload. Otherwise it will try to guess based on input
 */

export async function appendFileToForm(form: FormData, fieldName: string, input: Rev.FileUploadType, uploadOptions: Rev.UploadFileOptions = {}): Promise<Rev.UploadFileOptions> {
    const {
        file,
        options
    } = await polyfills.uploadParser.parse(input, uploadOptions)
    form.append(fieldName, file, options.filename);
    return options;
}
/**
 * helper to upload multipart forms with files attached.
 * This is to work around issues with node.js's FormData implementation
 * @param rev Rev Client
 * @param method
 * @param endpoint
 * @param form
 * @param useChunkedTransfer
 * @param options
 * @returns
 */

export async function uploadMultipart(
    rev: RevClient,
    method: Rev.HTTPMethod,
    endpoint: string,
    form: FormData,
    uploadOptions: Rev.UploadFileOptions,
    options: Rev.RequestOptions = {}
) {
    const {
        headers: optHeaders
    } = options;

    // coerce to Headers object, may be undefined
    const headers = new polyfills.Headers(optHeaders);
    options.headers = headers;

    // switches to transfer encoding upload if necessary in node
    // returns the body payload (on node.js it mutates options to set the body)
    const data = polyfills.beforeFileUploadRequest(form, headers, uploadOptions, options);

    const { body } = await rev.request(method, endpoint, data, options);
    return body;
}
