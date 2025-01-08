import { Rev, Transcription, Video } from "../types";
import { isPlainObject } from "../utils";
import type {RevClient} from "../rev-client";

/** @ignore */
export function videoDownloadAPI(rev: RevClient) {
    /**
     * Download a video. does not parse the output body. Note that content is sent as transfer-encoding: chunked;
     * @param videoId
     * @returns
     */
    async function download<T = ReadableStream>(videoId: string, options: Rev.RequestOptions = {}): Promise<Rev.Response<T>> {
        const response = await rev.request<T>('GET', `/api/v2/videos/${videoId}/download`, undefined, {
            responseType: 'stream',
            ...options
        });
        return response;
    }

    /**
     * download specified chapter. The chapter object has an imageUrl, this just wraps the functionality and adds the authorization header
     * @param chapter chapter object returned from the video.chapters(videoId) API call
     * @returns
     */
    async function downloadChapter(chapter: Video.Chapter, options: Rev.RequestOptions = {}) {
        const {imageUrl} = chapter;
        const { body } = await rev.request<Blob>('GET', imageUrl, undefined, { responseType: 'blob', ...options });
        return body;
    }

    async function downloadSupplemental<T = Blob>(file: Video.SupplementalFile, options?: Rev.RequestOptions): Promise<T>;
    async function downloadSupplemental<T = Blob>(videoId: string, fileId: string, options?: Rev.RequestOptions): Promise<T>;
    async function downloadSupplemental<T = Blob>(videoId: Video.SupplementalFile | string, fileId?: string | Rev.RequestOptions, options?: Rev.RequestOptions): Promise<T> {
        const endpoint = isPlainObject(videoId)
            ? videoId.downloadUrl
            : `/api/v2/videos/${videoId}/supplemental-files/${fileId}`;

        const opts = isPlainObject(fileId) ? fileId : options;

        const { body } = await rev.request<T>('GET', endpoint, undefined, { responseType: 'blob', ...opts });
        return body;
    }

    async function downloadTranscription<T = Blob>(transcription: Transcription, options?: Rev.RequestOptions): Promise<T>;
    async function downloadTranscription<T = Blob>(videoId: string, language: string, options?: Rev.RequestOptions): Promise<T>;
    async function downloadTranscription<T = Blob>(videoId: Transcription | string, language?: string | Rev.RequestOptions, options?: Rev.RequestOptions): Promise<T> {
        const endpoint = isPlainObject(videoId)
            ? videoId.downloadUrl
            : `/api/v2/videos/${videoId}/transcription-files/${language}`;

        const opts = isPlainObject(language) ? language : options;

        const { body } = await rev.request<T>('GET', endpoint, undefined, { responseType: 'blob', ...opts });
        return body;
    }

    async function downloadThumbnail<T = Blob>(thumbnailUrl: string, options?: Rev.RequestOptions): Promise<T>;
    async function downloadThumbnail<T = Blob>(query: { imageId: string }, options?: Rev.RequestOptions): Promise<T>;
    async function downloadThumbnail<T = Blob>(query: { videoId: string }, options?: Rev.RequestOptions): Promise<T>;
    async function downloadThumbnail<T = Blob>(query: string | { videoId?: string, imageId?: string; }, options: Rev.RequestOptions = {}): Promise<T> {
        let {
            videoId = '',
            imageId = ''
        } = typeof query === 'string'
                ? { imageId: query }
                : query;

        if (!(videoId || imageId)) {
            throw new TypeError('No video/image specified to download');
        }

        let thumbnailUrl: string = '';

        if (videoId) {
            thumbnailUrl = `/api/v2/videos/${videoId}/thumbnail`;
            // allow getting from api if only know the video ID
            // imageId = (await rev.get<{video: Video.Playback}>(`/api/v2/videos/${videoId}/playback-url`)).video.thumbnailUrl;
        } else if (imageId.startsWith('http')) {
            // thumbnail URI
            thumbnailUrl = `${imageId}${!imageId.endsWith('.jpg') ? '.jpg' : ''}`;
        } else {
            thumbnailUrl = `/api/v2/media/videos/thumbnails/${imageId}.jpg`;
        }

        const { body } = await rev.request<T>('GET', thumbnailUrl, undefined, { responseType: 'blob', ...options });
        return body;
    }
    /**
     * Download the thumbnail sheet image for a video
     * @param thumbnailSheet the thumbnailSheetUri or Thumbnail Configuration (get from video.thumbnailConfiguration)
     * @param options
     * @returns
     */
    async function downloadThumbnailSheet<T = Blob>(thumbnailSheet: string, options?: Rev.RequestOptions): Promise<T>;
    async function downloadThumbnailSheet<T = Blob>(thumbnailSheet: Video.ThumbnailConfiguration, options?: Rev.RequestOptions): Promise<T>;
    async function downloadThumbnailSheet<T = Blob>(thumbnailSheet: { videoId: string, sheetIndex?: string | number }, options?: Rev.RequestOptions): Promise<T>;
    async function downloadThumbnailSheet<T = Blob>(thumbnailSheet: string | { videoId: string, sheetIndex?: string | number } | Video.ThumbnailConfiguration, options?: Rev.RequestOptions): Promise<T> {
        let thumbnailSheetsUri = '';
        if (typeof thumbnailSheet === 'string') {
            thumbnailSheetsUri = thumbnailSheet;
        } else if (thumbnailSheet && typeof thumbnailSheet === 'object' && 'thumbnailSheetsUri' in thumbnailSheet) {
            thumbnailSheetsUri = thumbnailSheet.thumbnailSheetsUri;
        } else if (thumbnailSheet?.videoId) {
            const {videoId, sheetIndex = '1'} = thumbnailSheet;
            thumbnailSheetsUri = `/api/v2/videos/${videoId}/thumbnail-sheet/${sheetIndex}`;
        }

        if (!thumbnailSheetsUri) {
            throw new TypeError('No thumbnail sheet specified to download');
        }

        const { body } = await rev.request<T>('GET', thumbnailSheetsUri, undefined, { responseType: 'blob', ...options });
        return body;
    }

    return {
        download,
        downloadChapter,
        downloadSupplemental,
        downloadThumbnail,
        downloadTranscription,
        downloadThumbnailSheet
    };
}
