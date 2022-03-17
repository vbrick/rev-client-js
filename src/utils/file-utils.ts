import polyfills from '../interop';
import { isBlobLike } from './is-utils';
import type { RevClient } from '../rev-client';
import type { Rev } from '../types';

export type FileUploadType = string | File | Blob | AsyncIterable<any>;
export interface UploadFileOptions {
    /** specify filename of video as reported to Rev */
    filename?: string;
    /** specify content type of video */
    contentType?: string;
    /** if content length is known this will avoid needing to detect it */
    contentLength?: number;
    /** node-only - bypass dealing with content length and just upload as transfer-encoding: chunked */
    useChunkedTransfer?: boolean;
}
export interface FileUploadPayloadInternal {
    file: FileUploadType;
    options: UploadFileOptions;
}

export const mimeTypes = {
    '.7z': 'application/x-7z-compressed',
    '.asf': 'video/x-ms-asf',
    '.avi': 'video/x-msvideo',
    '.csv': 'text/csv',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.f4v': 'video/x-f4v',
    '.flv': 'video/x-flv',
    '.gif': 'image/gif',
    '.jpg': 'image/jpeg',
    '.m4a': 'audio/mp4',
    '.m4v': 'video/x-m4v',
    '.mkv': 'video/x-matroska',
    '.mov': 'video/quicktime',
    '.mp3': 'audio/mpeg',
    '.mp4': 'video/mp4',
    '.mpg': 'video/mpeg',
    '.pdf': 'application/pdf',
    '.png': 'image/png',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.rar': 'application/x-rar-compressed',
    '.srt': 'application/x-subrip',
    '.svg': 'image/svg+xml',
    '.swf': 'application/x-shockwave-flash',
    '.ts': 'video/mp2t',
    '.txt': 'text/plain',
    '.wmv': 'video/x-ms-wmv',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.zip': 'application/zip',
    '.mks': 'video/x-matroska',
    '.mts': 'model/vnd.mts',
    '.wma': 'audio/x-ms-wma'
};

export function getMimeForExtension(extension: string = '', defaultType = 'video/mp4') {
    extension = extension.toLowerCase();
    if (extension && (extension in mimeTypes)) {
        return mimeTypes[extension as keyof typeof mimeTypes];
    }
    return defaultType;
}

export function getExtensionForMime(contentType: string, defaultExtension = '.mp4') {
    const match = contentType && Object.entries(mimeTypes)
        .find(([ext, mime]) => contentType.startsWith((mime)));
    return match
        ? match[0]
        : defaultExtension;

}

function sanitizeFileUpload(payload: FileUploadPayloadInternal) {
    let {
        file,
        options: {
            filename = 'upload',
            contentType = ''
        }
    } = payload;

    // sanitize content type
    if (contentType === 'application/octet-stream') {
        contentType = '';
    }
    if (/charset/.test(contentType)) {
        contentType = contentType.replace(/;?.*charset.*$/, '');
    }
    let name = filename.replace('\.[^\.]+$', '');
    let ext = filename.replace(name, '');
    if (!ext) {
        ext = getExtensionForMime(contentType);
    }
    filename = `${name}${ext}`;
    if (!contentType) {
        contentType = getMimeForExtension(ext);
    }
    if (isBlobLike(file) && file.type !== contentType) {
        payload.file = file.slice(0, file.size, contentType);
    }
    Object.assign(payload.options, {
        filename,
        contentType
    });
    return payload;
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
export async function appendFileToForm(form: FormData, fieldName: string, file: FileUploadType, options: UploadFileOptions = { }): Promise<UploadFileOptions> {
    const opts: UploadFileOptions = {
        filename: 'upload',
        contentType: '',
        ...options
    };
    let payload = await polyfills.parseFileUpload(file, opts);
    payload = sanitizeFileUpload(payload);
    await polyfills.appendFileToForm(form, fieldName, payload);
    return payload.options;
}

async function prepareFileUploadHeaders(form: FormData, headers: Headers, useChunkedTransfer?: boolean) {
    await polyfills.prepareUploadHeaders(form, headers, useChunkedTransfer);
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
    useChunkedTransfer: boolean | UploadFileOptions = false,
    options: Rev.RequestOptions = { }
) {
    const {
        headers: optHeaders
    } = options;

    useChunkedTransfer = typeof useChunkedTransfer === 'boolean'
        ? useChunkedTransfer
        : !!useChunkedTransfer?.useChunkedTransfer;

    // coerce to Headers object, may be undefined
    const headers = new polyfills.Headers(optHeaders);
    // switches to transfer encoding upload if necessary
    await prepareFileUploadHeaders(form, headers, useChunkedTransfer);

    options.headers = headers;
    const { body } = await rev.request(method, endpoint, form, options);
    return body;
}
