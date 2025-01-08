import { Rev, LiteralString } from './rev';

/** @category Videos */
export namespace Upload {

    export type PresentationChaptersOptions = Rev.RequestOptions & Rev.UploadFileOptions & {
        contentType?: LiteralString<'application/vnd.ms-powerpoint' |
            'application/vnd.openxmlformats-officedocument.presentationml.presentation'>;
    };

    export type TranscriptionOptions = Rev.RequestOptions & Rev.UploadFileOptions & {
        contentType?: LiteralString<'text/plain' |
            'text/vtt' |
            'application/x-subrip'>;
    };

    export type SupplementalOptions = Rev.RequestOptions & Omit<Rev.UploadFileOptions, 'filename' | 'contentLength'> & {
        contentType?: LiteralString<'application/x-7z-compressed' |
            'text/csv' |
            'application/msword' |
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document' |
            'image/gif' |
            'image/jpeg' |
            'application/pdf' |
            'image/png' |
            'application/vnd.ms-powerpoint' |
            'application/vnd.openxmlformats-officedocument.presentationml.presentation' |
            'application/x-rar-compressed' |
            'image/svg+xml' |
            'text/plain' |
            'application/vnd.ms-excel' |
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' |
            'application/zip'>;
    };

}
