import { Video } from "../types";
import { isPlainObject } from "../utils";
import type {RevClient} from "../rev-client";


export function videoDownloadAPI(rev: RevClient) {
    /**
     * Download a video. does not parse the output body. Note that content is sent as transfer-encoding: chunked;
     * @param videoId
     * @returns
     */
    async function download(videoId: string) {
        const response = await rev.request<ReadableStream>('GET', `/api/v2/videos/${videoId}/download`, undefined, {
            responseType: 'stream'
        });
        return response;
    }

    /**
     * download specified chapter. The chapter object has an imageUrl, this just wraps the functionality and adds the authorization header
     * @param videoId
     * @param chapter chapter object returned from the video.chapters(videoId) API call
     * @returns
     */
    async function downloadChapter(chapter: Video.Chapter) {
        const {imageUrl} = chapter;
        const { body } = await rev.request<Blob>('GET', imageUrl, undefined, { responseType: 'blob' });
        return body;
    }

    async function downloadSupplemental(transcription: Video.SupplementalFile): Promise<Blob>;
    async function downloadSupplemental(videoId: string, fileId: string): Promise<Blob>;
    async function downloadSupplemental(videoId: Video.SupplementalFile | string, fileId?: string) {
        const endpoint = isPlainObject(videoId)
            ? videoId.downloadUrl
            : `/api/v2/videos/${videoId}/supplemental-files/${fileId}`;

        const { body } = await rev.request<Blob>('GET', endpoint, undefined, { responseType: 'blob' });
        return body;
    }

    async function downloadTranscription(transcription: Video.Transcription): Promise<Blob>;
    async function downloadTranscription(videoId: string, language: string): Promise<Blob>;
    async function downloadTranscription(videoId: Video.Transcription | string, language?: string) {
        const endpoint = isPlainObject(videoId)
            ? videoId.downloadUrl
            : `/api/v2/videos/${videoId}/transcription-files/${language}`;

        const { body } = await rev.request<Blob>('GET', endpoint, undefined, { responseType: 'blob' });
        return body;
    }

    async function downloadThumbnail(thumbnailUrl: string): Promise<Blob>;
    async function downloadThumbnail(query: { imageId: string }): Promise<Blob>;
    async function downloadThumbnail(query: { videoId: string }): Promise<Blob>;
    async function downloadThumbnail(query: string | { videoId?: string, imageId?: string; }) {
        let {
            videoId = '',
            imageId = ''
        } = typeof query === 'string'
                ? { imageId: query }
                : query;

        if (!(videoId || imageId)) {
            throw new TypeError('No video/image specified to download');
        }

        if (!imageId) {
            // allow getting from api if only know the video ID
            imageId = (await rev.get<{video: Video.Playback}>(`/api/v2/videos/${videoId}/playback-url`)).video.thumbnailUrl;
        } else if (!imageId.endsWith('.jpg')) {
            // make sure id has ending file extension
            imageId = `${imageId}.jpg`;
        }

        let thumbnailUrl: string = imageId.startsWith('http')
            ? imageId
            : `/api/v2/media/videos/thumbnails/${imageId}.jpg`;

        const { body } = await rev.request<Blob>('GET', thumbnailUrl, undefined, { responseType: 'blob' });
        return body;
    }

    return {
        download,
        downloadChapter,
        downloadSupplemental,
        downloadThumbnail,
        downloadTranscription
    };
}
