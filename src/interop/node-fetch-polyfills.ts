import fetch, { FormData, File, Blob, type RequestInit } from 'node-fetch';
import { FormDataEncoder } from "form-data-encoder";
import { Readable } from "node:stream";
import type { Rev } from "../types/rev";

import type {RevPolyfills} from './polyfills';

function beforeFileUploadRequest(form: FormData, headers: Headers, uploadOptions: Rev.UploadFileOptions, options: Rev.RequestOptions) {
    const encoder = new FormDataEncoder(form);
    if (uploadOptions.useChunkedTransfer) {
        headers.set('transfer-encoding', 'chunked');
    }

    (options as RequestInit).body = Readable.from(encoder) as any;
    // set content-type and possibly content-length from form encoder
    for (let [key, value] of Object.entries(encoder.headers)) {
        headers.set(key, value);
    }
    return undefined;
}

export default (polyfills: RevPolyfills) => {
    Object.assign(polyfills, {
        fetch,
        FormData,
        File,
        Blob,
        beforeFileUploadRequest
    });
};
