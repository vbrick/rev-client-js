import polyfills from '../interop/polyfills';
import type { RevClient } from '../rev-client';
import { Rev, Transcription, Video, Webcast } from '../types/index';
import type { Upload } from '../types/upload';
import { RateLimitEnum } from '../utils';
import { appendFileToForm, appendJSONToForm, uploadMultipart } from '../utils/multipart-utils';

function splitOptions(options: Rev.UploadFileOptions & Rev.RequestOptions, defaultType?: string) {
    const {
        filename,
        contentType,
        contentLength,
        useChunkedTransfer,
        defaultContentType = defaultType,
        ...requestOptions
    } = options;

    return {
        requestOptions,
        uploadOptions: {
            filename,
            contentType,
            contentLength,
            useChunkedTransfer,
            defaultContentType
        }
    };
}

/**
 * @ignore
 */
export type API = ReturnType<typeof uploadAPIFactory>;
/**
 * Functions to upload binary content to Rev.
 * @category Videos
 * @group API
 * @see [Upload API Docs](https://revdocs.vbrick.com/reference/uploadvideo-1)
 */
export interface UploadAPI extends API {};

/** @ignore */
export default function uploadAPIFactory(rev: RevClient) {
    const { FormData } = polyfills;



    const uploadAPI = {
        /**
         * Upload a video, and returns the resulting video ID
         * @see [API Docs](https://revdocs.vbrick.com/reference/uploadvideo-1)
         *
         * @example
         * ```js
        const rev = new RevClient(...config...);
        await rev.connect();

        // if browser - pass in File
        const file = fileInputElement.files[0];
        // if nodejs - can pass in path to file instead
        // const file = "/path/to/local/video.mp4";
        // upload returns resulting ID when complete
        const videoId = await rev.upload.video(file, {
            uploader: 'username.of.uploader',
            title: 'video uploaded via the API',
            //categories: [EXISTING_REV_CATEGORY_NAME],
            unlisted: true,
            isActive: true
            /// ...any additional metadata
        });
        ```
         * @param file A File/Blob. if using nodejs you can also pass in the path to a file
         * @param metadata metadata to add to video (title, etc.) - see API docs
         * @param options Additional `RequestInit` options, as well as customizing the contentType/contentLength/filename of the `file` in the POST upload form (only needed if they can't be inferred from input)
         * @returns the resulting video id
         */
        async video(
            file: Rev.FileUploadType,
            metadata: Video.UploadMetadata = { uploader: rev.session.username ?? '' },
            options: Upload.VideoOptions = {}): Promise<string> {

            const { uploadOptions, requestOptions } = splitOptions(options, 'video/mp4');

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

            await rev.session.queueRequest(RateLimitEnum.UploadVideo);

            const { videoId } = await uploadMultipart(rev, 'POST', '/api/v2/uploads/videos', form, filePayload, requestOptions);
            return videoId;
        },
        /**
         * Replace an existing video with an uploaded file
         * @see [API Docs](https://revdocs.vbrick.com/reference/replacevideo)
         */
        async replaceVideo(videoId: string, file: Rev.FileUploadType, options: Upload.VideoOptions = {}): Promise<void> {
            const { uploadOptions, requestOptions } = splitOptions(options, 'video/mp4');
            const form = new FormData();
            const filePayload = await appendFileToForm(form, 'VideoFile', file, uploadOptions);

            rev.log('info', `Replacing ${videoId} with ${filePayload.filename} (${filePayload.contentType})`);

            await rev.session.queueRequest(RateLimitEnum.UploadVideo);

            await uploadMultipart(rev, 'PUT', `/api/v2/uploads/videos/${videoId}`, form, filePayload, requestOptions);
        },
        async transcription(videoId: string, file: Rev.FileUploadType, language: Transcription.SupportedLanguage = 'en', options: Upload.TranscriptionOptions = { }): Promise<void> {
            const { uploadOptions, requestOptions } = splitOptions(options, 'application/x-subrip');

            const form = new FormData();
            const lang = language.toLowerCase();

            // uploads will fail if files end with the txt file extension, so make sure it's set to a valid value
            if (uploadOptions.contentType === 'text/plain' || uploadOptions.filename?.endsWith('txt')) {
                uploadOptions.filename = `${uploadOptions.filename || 'upload'}.srt`;
            }

            const filePayload = await appendFileToForm(form, 'File', file, uploadOptions);
            const metadata = {
                files: [
                    { language: lang, fileName: filePayload.filename }
                ]
            };
            appendJSONToForm(form, 'TranscriptionFiles', metadata);

            rev.log('info', `Uploading transcription to ${videoId} ${lang} ${filePayload.filename} (${filePayload.contentType})`);

            await uploadMultipart(rev, 'POST', `/api/v2/uploads/transcription-files/${videoId}`, form, filePayload, requestOptions);
        },
        async supplementalFile(videoId: string, file: Rev.FileUploadType, options: Upload.SupplementalOptions = {}) {
            const { uploadOptions, requestOptions } = splitOptions(options);

            const form = new FormData();

            const filePayload = await appendFileToForm(form, 'File', file, uploadOptions);
            const metadata = {
                files: [
                    { fileName: filePayload.filename }
                ]
            };
            appendJSONToForm(form, 'SupplementalFiles', metadata);

            rev.log('info', `Uploading supplemental content to ${videoId} ${filePayload.filename} (${filePayload.contentType})`);

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
        async chapters(videoId: string, chapters: Video.Chapter.Request[], action: 'append' | 'replace' = 'replace', options: Rev.RequestOptions = {}) {
            const { uploadOptions, requestOptions } = splitOptions(options, 'image/png');

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
                metadata.chapters.push(chapterEntry);
            }

            appendJSONToForm(form, 'Chapters', metadata);

            rev.log('info', `${action === 'replace' ? 'Uploading' : 'Updating'} ${metadata.chapters.length} chapters to ${videoId}`);

            const method = action === 'replace'
                ? 'POST'
                : 'PUT';

            await uploadMultipart(rev, method, `/api/v2/uploads/chapters/${videoId}`, form, uploadOptions, requestOptions);
        },
        async thumbnail(videoId: string, file: Rev.FileUploadType, options: Upload.ImageOptions = {}) {
            const { uploadOptions, requestOptions } = splitOptions(options, 'image/jpeg');

            const form = new FormData();

            const filePayload = await appendFileToForm(form, 'ThumbnailFile', file, uploadOptions);

            rev.log('info', `Uploading thumbnail for ${videoId} ${filePayload.filename} (${filePayload.contentType})`);

            await uploadMultipart(rev, 'POST', `/api/v2/uploads/images/${videoId}`, form, filePayload, requestOptions);
        },
        async presentationChapters(videoId: string, file: Rev.FileUploadType, options: Upload.PresentationChaptersOptions = {}) {
            const { uploadOptions, requestOptions } = splitOptions(options, 'application/vnd.ms-powerpoint');

            const form = new FormData();

            const filePayload = await appendFileToForm(form, 'PresentationFile', file, uploadOptions);

            rev.log('info', `Uploading presentation for ${videoId} ${filePayload.filename} (${filePayload.contentType})`);

            await uploadMultipart(rev, 'POST', `/api/v2/uploads/video-presentations/${videoId}`, form, filePayload, requestOptions);
        },
        async webcastPresentation(eventId: string, file: Rev.FileUploadType, options: Upload.PresentationChaptersOptions) {
            const { uploadOptions, requestOptions } = splitOptions(options, 'application/vnd.ms-powerpoint');

            const form = new FormData();

            const filePayload = await appendFileToForm(form, 'PresentationFile', file, uploadOptions);

            rev.log('info', `Uploading presentation for ${eventId} ${filePayload.filename} (${filePayload.contentType})`);

            await uploadMultipart(rev, 'POST', `/api/v2/uploads/presentations/${eventId}`, form, filePayload, requestOptions);
        },
        async webcastBackground(eventId: string, file: Rev.FileUploadType, options: Upload.ImageOptions) {
            const { uploadOptions, requestOptions } = splitOptions(options, 'image/jpeg');

            const form = new FormData();

            const filePayload = await appendFileToForm(form, 'ImageFile', file, uploadOptions);

            rev.log('info', `Uploading background image for ${eventId} ${filePayload.filename} (${filePayload.contentType})`);

            await uploadMultipart(rev, 'POST', `/api/v2/uploads/background-image/${eventId}`, form, filePayload, requestOptions);
        },
        async webcastProducerLayoutBackground(eventId: string, file: Rev.FileUploadType, options: Upload.ImageOptions) {
            const { uploadOptions, requestOptions } = splitOptions(options, 'image/jpeg');

            const form = new FormData();

            const filePayload = await appendFileToForm(form, 'ImageFile', file, uploadOptions);

            rev.log('info', `Uploading producer layout background image for ${eventId} ${filePayload.filename} (${filePayload.contentType})`);

            await uploadMultipart(rev, 'POST', `/api/v2/uploads/webcast-producer-bgimage/${eventId}`, form, filePayload, requestOptions);
        },
        async webcastBranding(eventId: string, request: Webcast.BrandingRequest, options: Upload.ImageOptions = { }): Promise<void> {
            const { uploadOptions, requestOptions } = splitOptions(options, 'image/jpeg');

            const form = new FormData();

            const logoOptions: Rev.UploadFileOptions = {
                ...uploadOptions,
                // make sure filename is by default unique
                filename: 'logo',
                ...(request.logoImageOptions ?? {})
            };
            const backgroundOptions: Rev.UploadFileOptions = {
                ...uploadOptions,
                // make sure filename is by default unique
                filename: 'background',
                ...(request.logoImageOptions ?? {})
            };

            const logoImagePayload = await appendFileToForm(form, 'LogoImageFile', request.logoImage, logoOptions);
            const backgroundImagePayload = await appendFileToForm(form, 'BackgroundImageFile', request.backgroundImage, backgroundOptions);

            const meta = {
                ...request.branding,
                logoImageFilename: logoImagePayload.filename,
                backgroundImageFilename: backgroundImagePayload.filename
            };

            appendJSONToForm(form, 'Branding', meta);

            rev.log('info', `Uploading webcast branding to ${eventId} (${meta.logoImageFilename} ${meta.backgroundImageFilename})`);

            await uploadMultipart(rev, 'POST', `/api/v2/uploads/webcast-branding/${eventId}`, form, uploadOptions, requestOptions);
        async channelLogo(channelId: string, file: Rev.FileUploadType, options: Upload.ImageOptions = {}) {
            const { uploadOptions, requestOptions } = splitOptions(options, 'image/jpeg');

            const form = new FormData();

            const filePayload = await appendFileToForm(form, 'ImageFile', file, uploadOptions);

            rev.log('info', `Uploading channel logo for ${channelId} (${filePayload.filename} ${filePayload.contentType})`);

            await uploadMultipart(rev, 'POST', `/api/v2/uploads/channel-logo/${channelId}`, form, filePayload, requestOptions);
        }
    };

    return uploadAPI;
}
