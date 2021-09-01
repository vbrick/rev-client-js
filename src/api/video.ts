import type { RevClient } from '../rev-client';
import { Video, Rev } from '../types';
import { searchScrollStream } from '../utils/request-utils';

export default function videoAPIFactory(rev: RevClient) {
    const videoAPI = {
        /**
         * This is an example of using the video Patch API to only update a single field
         * @param videoId
         * @param title
         */
        async setTitle(videoId: string, title: string) {
            const payload = [{ op: 'add', path: '/Title', value: title }];
            await rev.patch(`/api/v2/videos/${videoId}`, payload);
        },
        /**
         * get processing status of a video
         * @param videoId
         */
        async status(videoId: string): Promise<Video.StatusResponse> {
            return rev.get(`/api/v2/videos/${videoId}/status`);
        },
        async details(videoId: string): Promise<Video.Details> {
            return rev.get(`/api/v2/videos/${videoId}/details`);
        },
        get upload() {
            return rev.upload.video;
        },
        /**
         * search for videos. leave blank to get all videos in the account
         */
        async search(query: Video.SearchOptions = { }, options: Rev.SearchOptions<Video.SearchHit> = { }) {
            const searchDefinition = {
                endpoint: '/api/v2/videos/search',
                totalKey: 'totalVideos',
                hitsKey: 'videos'
            };
            const results: Video.SearchHit[] = [];
            const pager = searchScrollStream<Video.SearchHit>(rev, searchDefinition, query, options);

            for await (const video of pager) {

                results.push(video);
            }
            return results;
        },
        /**
         * Example of using the video search API to search for videos, then getting
         * the details of each video
         * @param query
         * @param options
         */
        async * searchDetailed(query: Video.SearchOptions = { }, options: Rev.SearchOptions<Video.SearchHit> = { }): AsyncGenerator<Video.SearchHit & (Video.Details | { error?: Error; })> {
            const searchDefinition = {
                endpoint: '/api/v2/videos/search',
                totalKey: 'totalVideos',
                hitsKey: 'videos'
            };
            const pager = searchScrollStream<Video.SearchHit>(rev, searchDefinition, query, options);
            for await (const rawVideo of pager) {
                const out: Video.SearchHit & (Video.Details | { error?: Error; }) = rawVideo;
                try {
                    const details = await videoAPI.details(rawVideo.id);
                    Object.assign(out, details);
                } catch (error) {
                    out.error = error;
                }
                yield out;
            }
        },
        async playbackInfo(videoId: string): Promise<Video.Playback> {
            const { video } = await rev.get(`/api/v2/videos/${videoId}/playback-url`);
            return video;
        },
        async download(videoId: string) {
            const response = await rev.request<ReadableStream>('GET', `/api/v2/videos/${videoId}/download`, undefined, {
                responseType: 'stream'
            });
            return response;
        },
        async downloadTranscription(videoId: string, language: string) {
            const { body } = await rev.request<Blob>('GET', `/api/v2/videos/${videoId}/transcription-files/${language}`, undefined, { responseType: 'blob' });
            return body;
        },
        async downloadThumbnail(query: string | { videoId?: string, imageId?: string; }) {
            const {
                videoId = '',
                imageId = ''
            } = typeof query === 'string'
                    ? { imageId: query }
                    : query;

            if (!(videoId || imageId)) {
                throw new TypeError('No video/image specified to download');
            }

            let thumbnailUrl = imageId
                ? `/api/v2/media/videos/thumbnails/${imageId}.jpg`
                // allow getting from api if only know the video ID
                : (await videoAPI.playbackInfo(videoId)).thumbnailUrl;

            const { body } = await rev.request<Blob>('GET', thumbnailUrl, undefined, { responseType: 'blob' });
            return body;
        }
    };
    return videoAPI;
}
