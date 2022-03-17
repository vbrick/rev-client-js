/**
 * There are slight differences in handling browser and node.js environments.
 * This folder wraps all components that get polyfilled in node.js, as well as
 * allowing uploading a video from the local filesystem on node.js
 */
import { isBlobLike } from '../utils/is-utils';
import type { UploadFileOptions, FileUploadPayloadInternal, FileUploadType } from '../utils/file-utils';

/**
 * used to sign the verifier in OAuth workflow
 */
async function hmacSign(message: string, secret: string) {
    const enc = new TextEncoder();
    const cryptoKey = await crypto.subtle
        .importKey(
            'raw',
            enc.encode(secret),
            { name: 'HMAC', hash: 'SHA-256' },
            true,
            ['sign']
        );
    const signed = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(message));
    return btoa(String.fromCharCode(...new Uint8Array(signed)));
}


export default {
    AbortController: globalThis.AbortController,
    AbortSignal: globalThis.AbortSignal,
    createAbortError(message: string): Error {
        return new DOMException(message, 'AbortError');
    },
    fetch: (...args: Parameters<typeof fetch>) => globalThis.fetch(...args),
    FormData: globalThis.FormData,
    Headers: globalThis.Headers,
    Request: globalThis.Request,
    Response: globalThis.Response,
    hmacSign,
    /**
     *
     * @param file
     * @param filename
     * @param contentType
     * @returns
     */
    async parseFileUpload(file: FileUploadType, options: UploadFileOptions): Promise<FileUploadPayloadInternal> {
        let {
            filename,
            contentType,
            contentLength
        } = options;

        if (isBlobLike(file)) {
            const { type, name, size } = <File>file;
            if (type && !contentType) {
                contentType = type;
            }
            if (name && !filename) {
                filename = name;
            }
            if (size && !contentLength) {
                contentLength = size;
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
        throw new TypeError('Only Blob / Files are supported for file uploads. Pass a File/Blob object');
    },
    appendFileToForm(form: FormData, fieldName: string, payload: FileUploadPayloadInternal) {
        const {
            file,
            options: {
                filename
            }
        } = payload;
        form.append(fieldName, file as Blob, filename);
    },
    async prepareUploadHeaders(form: FormData, headers: Headers, useChunkedTransfer?: boolean) {
        // nothing - this is used for fixing node's form-data behavior
    }
};
