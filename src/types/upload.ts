import type { Rev, LiteralString } from './rev';

/** @category Videos */
export namespace Upload {
    export type VideoOptions = Rev.RequestOptions & Rev.UploadFileOptions & {
        contentType?: LiteralString<
            'video/x-ms-asf' |
            'video/x-msvideo' |
            'video/x-f4v' |
            'video/x-flv' |
            'audio/mp4' |
            'video/x-m4v' |
            'video/x-matroska' |
            'video/quicktime' |
            'audio/mpeg' |
            'video/mp4' |
            'video/mpeg' |
            'video/mp2t' |
            'video/x-ms-wmv' |
            'application/zip' |
            'video/x-matroska' |
            'model/vnd.mts' |
            'audio/x-ms-wma'>
    }

    export type ImageOptions = Rev.RequestOptions & Rev.UploadFileOptions & {
        contentType?: LiteralString<'image/gif' | 'image/jpeg' | 'image/png'>;
    }

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
