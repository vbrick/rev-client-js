import type { RevClient } from '../rev-client';
import { Video } from '../types';
import { appendFileToForm, appendJSONToForm, FileUploadType, UploadFileOptions, uploadMultipart } from '../utils/file-utils';
import polyfills from '../interop';

export default function uploadAPIFactory(rev: RevClient) {
    const { FormData } = polyfills;
    const uploadAPI = {
        /**
         * Upload a video, and returns the resulting video ID
         */
        async video(
            file: FileUploadType,
            metadata: Video.UploadMetadata = { uploader: rev.session.username ?? '' },
            options: UploadFileOptions = { }): Promise<string> {

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
            const filePayload = await appendFileToForm(form, 'VideoFile', file, options);

            rev.log('info', `Uploading ${filePayload.filename} (${filePayload.contentType})`);

            const { videoId } = await uploadMultipart(rev, 'POST', '/api/v2/uploads/videos', form, filePayload);
            return videoId;
        },
        async transcription(videoId: string, file: FileUploadType, language: string = 'en', options: UploadFileOptions & { contentType?: 'text/plain' | 'application/x-subrip'; } = { }): Promise<void> {
            const opts = {
                // acceptable are text/plain and application/x-subrip
                contentType: 'application/x-subrip',
                filename: 'subtitle.srt'
            };

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

            const filePayload = await appendFileToForm(form, 'File', file, options);
            const metadata = {
                files: [
                    { language: lang, fileName: filePayload.filename }
                ]
            };
            appendJSONToForm(form, 'TranscriptionFiles', metadata);

            rev.log('info', `Uploading transcription to ${videoId} (${lang} ${filePayload.filename} (${filePayload.contentType})`);

            await uploadMultipart(rev, 'POST', `/api/v2/transcription-files/${videoId}`, form, filePayload);
        }
    };
    return uploadAPI;
}
