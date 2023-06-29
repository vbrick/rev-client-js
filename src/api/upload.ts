import type { RevClient } from '../rev-client';
import { Rev, Video } from '../types';
import { appendFileToForm, appendJSONToForm, uploadMultipart } from '../utils/file-utils';
import polyfills from '../interop';

function splitOptions(options: Rev.UploadFileOptions) {
    const {
        signal,
        ...uploadOptions
    } = options;

    return {
        requestOptions: signal ? { signal } : {},
        uploadOptions
    };
}

type PresentationChaptersOptions = Rev.RequestOptions & Rev.UploadFileOptions & {
    contentType?: 'application/vnd.ms-powerpoint'
                | 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
};

type TranscriptionOptions = Rev.RequestOptions & Rev.UploadFileOptions & {
    contentType?: 'text/plain'
                | 'application/x-subrip';
};

type ChaptersOptions = Rev.RequestOptions & Omit<Rev.UploadFileOptions, 'filename' | 'contentLength'> & {
    contentType?: 'application/x-7z-compressed'
                | 'text/csv'
                | 'application/msword'
                | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                | 'image/gif'
                | 'image/jpeg'
                | 'application/pdf'
                | 'image/png'
                | 'application/vnd.ms-powerpoint'
                | 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
                | 'application/x-rar-compressed'
                | 'image/svg+xml'
                | 'text/plain'
                | 'application/vnd.ms-excel'
                | 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                | 'application/zip'
};

export default function uploadAPIFactory(rev: RevClient) {
    const { FormData } = polyfills;



    const uploadAPI = {
        /**
         * Upload a video, and returns the resulting video ID
         */
        async video(
            file: Rev.FileUploadType,
            metadata: Video.UploadMetadata = { uploader: rev.session.username ?? '' },
            options: Rev.UploadFileOptions = {}): Promise<string> {

            const { uploadOptions, requestOptions } = splitOptions(options);

            // prepare payload
            const form = new FormData();

            // at bare minimum the uploader needs to be defined
            if (!metadata.uploader) {
                // if using username login then uploader can be set to current user
                const defaultUsername = rev.session.username;
                if (defaultUsername) {
                    metadata.uploader = defaultUsername;
                } else {
                    throw new TypeError('metadata must include uploader parameter');
                }
            }

            // add video metadata to body (as json)
            appendJSONToForm(form, 'video', metadata);

            // append file (works around some node's form-data library quirks)
            const filePayload = await appendFileToForm(form, 'VideoFile', file, uploadOptions);

            rev.log('info', `Uploading ${filePayload.filename} (${filePayload.contentType})`);

            const { videoId } = await uploadMultipart(rev, 'POST', '/api/v2/uploads/videos', form, filePayload, requestOptions);
            return videoId;
        },
        async transcription(videoId: string, file: Rev.FileUploadType, language: Video.Transcription.SupportedLanguages = 'en', options: TranscriptionOptions = { }): Promise<void> {
            const { uploadOptions, requestOptions } = splitOptions(options);

            // validate language
            // TODO put this in a constants file somewhere
            const supportedLanguages = ['de', 'en', 'en-gb', 'es-es', 'es-419', 'es', 'fr', 'fr-ca', 'id', 'it', 'ko', 'ja', 'nl', 'no', 'pl', 'pt', 'pt-br', 'th', 'tr', 'fi', 'sv', 'ru', 'el', 'zh', 'zh-tw', 'zh-cmn-hans'];

            let lang = language.toLowerCase();
            if (!supportedLanguages.includes(lang)) {
                // try removing trailing language specifier
                lang = lang.slice(2);
                if (!supportedLanguages.includes(lang)) {
                    throw new TypeError(`Invalid language ${language} - supported values are ${supportedLanguages.join(', ')}`);
                }
            }

            const form = new FormData();

            const filePayload = await appendFileToForm(form, 'File', file, uploadOptions);
            const metadata = {
                files: [
                    { language: lang, fileName: filePayload.filename }
                ]
            };
            appendJSONToForm(form, 'TranscriptionFiles', metadata);

            rev.log('info', `Uploading transcription to ${videoId} (${lang} ${filePayload.filename} (${filePayload.contentType})`);

            await uploadMultipart(rev, 'POST', `/api/v2/uploads/transcription-files/${videoId}`, form, filePayload, requestOptions);
        },
        async supplementalFile(videoId: string, file: Rev.FileUploadType, options: Rev.RequestOptions & Rev.UploadFileOptions = {}) {
            const { uploadOptions, requestOptions } = splitOptions(options);

            const form = new FormData();

            const filePayload = await appendFileToForm(form, 'File', file, uploadOptions);
            const metadata = {
                files: [
                    { fileName: filePayload.filename }
                ]
            };
            appendJSONToForm(form, 'SupplementalFiles', metadata);

            rev.log('info', `Uploading supplemental content to ${videoId} (${filePayload.filename} (${filePayload.contentType})`);

            await uploadMultipart(rev, 'POST', `/api/v2/uploads/supplemental-files/${videoId}`, form, filePayload, requestOptions);
        },
        /**
         *
         * @param videoId id of video to add chapters to
         * @param chapters list of chapters. Must have time value and one of title or imageFile
         * @param action replace = POST/replace existing with this payload
         *               append = PUT/add or edit without removing existing
         * @param options  additional upload + request options
         */
        async chapters(videoId: string, chapters: Video.Chapter.Request[], action: 'append' | 'replace' = 'replace', options: ChaptersOptions = {}) {
            const { uploadOptions, requestOptions } = splitOptions(options);

            const form = new FormData();

            type ChapterPayload = Video.Chapter.Request & {imageFile?: string};

            const metadata: {chapters: ChapterPayload[]} = {
                chapters: []
            };

            for (let chapter of chapters) {
                const {
                    title, time, imageFile, uploadOptions: fileUploadOptions = {}
                } = chapter;

                const chapterEntry: ChapterPayload = { time };
                if (title) {
                    chapterEntry.title = title;
                }
                if (imageFile) {
                    const filePayload = await appendFileToForm(form, 'File', imageFile, { ...uploadOptions, ...fileUploadOptions });
                    // add image filename based on what was appended to form
                    chapterEntry.imageFile = filePayload.filename;
                }
            }

            appendJSONToForm(form, 'Chapters', metadata);

            rev.log('info', `${action === 'replace' ? 'Uploading' : 'Updating'} ${metadata.chapters.length} chapters to ${videoId}`);

            const method = action === 'replace'
                ? 'POST'
                : 'PUT';

            await uploadMultipart(rev, method, `/api/v2/uploads/chapters/${videoId}`, form, uploadOptions, requestOptions);
        },
        async thumbnail(videoId: string, file: Rev.FileUploadType, options: Rev.RequestOptions & Rev.UploadFileOptions = {}) {
            const { uploadOptions, requestOptions } = splitOptions(options);

            const form = new FormData();

            const filePayload = await appendFileToForm(form, 'ThumbnailFile', file, uploadOptions);

            rev.log('info', `Uploading thumbnail for ${videoId} (${filePayload.filename} (${filePayload.contentType})`);

            await uploadMultipart(rev, 'POST', `/api/v2/uploads/images/${videoId}`, form, filePayload, requestOptions);
        },
        async presentationChapters(videoId: string, file: Rev.FileUploadType, options: PresentationChaptersOptions = {}) {
            const { uploadOptions, requestOptions } = splitOptions(options);

            const form = new FormData();

            const filePayload = await appendFileToForm(form, 'ThumbnailFile', file, uploadOptions);

            rev.log('info', `Uploading thumbnail for ${videoId} (${filePayload.filename} (${filePayload.contentType})`);

            await uploadMultipart(rev, 'POST', `/api/v2/uploads/images/${videoId}`, form, filePayload, requestOptions);
        }
    };

    return uploadAPI;
}
