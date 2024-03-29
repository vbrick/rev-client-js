import { RevError } from '../rev-error';
import type { RevClient } from '../rev-client';
import { Video, Rev, Admin } from '../types';
import { SearchRequest } from '../utils/request-utils';
import { videoReportAPI } from './video-report-request';
import { videoDownloadAPI } from './video-download';

type VideoSearchDetailedItem = Video.SearchHit & (Video.Details | { error?: Error });

export default function videoAPIFactory(rev: RevClient) {
    /** get list of comments on a video
         * set showAll param to true to include un-redacted values of comments (admin only)
         */
    function comments(videoId: string): Promise<Video.Comment[]>;
    function comments(videoId: string, showAll: true): Promise<Video.Comment.Unredacted[]>;
    async function comments(videoId: string, showAll: boolean = false): Promise<Video.Comment[] | Video.Comment.Unredacted[]> {
        const response = await rev.get<Video.Comment.ListResponse>(`/api/v2/videos/${videoId}/comments`, showAll ? { showAll: 'true' } : undefined);
        return response.comments;
    }
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
         * Use the Patch API to update a single Custom Field.
         * @param videoId - id of video to update
         * @param customField - the custom field object (with id and value)
         */
        async setCustomField(videoId: string, customField: Pick<Admin.CustomField, 'id' | 'value'>) {
            const payload = [
                { op: 'remove', path: '/customFields', value: customField.id },
                { op: 'add', path: '/customFields/-', value: customField }
            ];
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
        comments,
        async chapters(videoId: string): Promise<Video.Chapter[]> {
            try {
                const {chapters} = await rev.get<{chapters: Video.Chapter[]}>(`/api/v2/videos/${videoId}/chapters`);
                return chapters;
            } catch (err) {
                // if no chapters then this api returns a 400 response
                if (err instanceof RevError && err.code === "NoVideoChapters") {
                    return [];
                }
                throw err;
            }
        },
        async supplementalFiles(videoId: string): Promise<Video.SupplementalFile[]> {
            const {supplementalFiles} = await rev.get(`/api/v2/videos/${videoId}/supplemental-files`);
            return supplementalFiles;
        },
        // async deleteSupplementalFiles(videoId: string, fileId: string | string[]): Promise<void> {
        //     const fileIds = Array.isArray(fileId)
        //         ? fileId.join(',')
        //         : fileId
        //     await rev.delete(`/api/v2/videos/${videoId}/supplemental-files`, { fileIds });
        // },
        async transcriptions(videoId: string): Promise<Video.Transcription[]> {
            const {transcriptionFiles} = await rev.get(`/api/v2/videos/${videoId}/transcription-files`);
            return transcriptionFiles;
        },
        get upload() {
            return rev.upload.video;
        },
        async migrate(videoId: string, options: Video.MigrateRequest) {
            await rev.put(`/api/v2/videos/${videoId}/migration`, options);
        },
        /**
         * search for videos, return as one big list. leave blank to get all videos in the account
         */
        search(query: Video.SearchOptions = { }, options: Rev.SearchOptions<Video.SearchHit> = { }): Rev.ISearchRequest<Video.SearchHit> {
            const searchDefinition = {
                endpoint: '/api/v2/videos/search',
                totalKey: 'totalVideos',
                hitsKey: 'videos'
            };
            const request = new SearchRequest<Video.SearchHit>(rev, searchDefinition, query, options);
            return request;
        },
        /**
         * Example of using the video search API to search for videos, then getting
         * the details of each video
         * @param query
         * @param options
         */
        searchDetailed(
            query: Video.SearchOptions = { },
            options: Rev.SearchOptions<VideoSearchDetailedItem> = { }
        ): Rev.ISearchRequest<VideoSearchDetailedItem> {
            const searchDefinition = {
                endpoint: '/api/v2/videos/search',
                totalKey: 'totalVideos',
                hitsKey: 'videos',
                transform: async (videos: Video.SearchHit[]) => {
                    const result = [];
                    for (let rawVideo of videos) {
                        const out: Video.SearchHit & (Video.Details & { error?: Error; }) = rawVideo as any;
                        try {
                            const details = await videoAPI.details(rawVideo.id);
                            Object.assign(out, details);
                        } catch (error: any) {
                            out.error = error;
                        }
                        result.push(out);
                    }
                    return result;
                }
            };
            const request = new SearchRequest<Video.SearchHit>(rev, searchDefinition, query, options);
            return request;
        },
        async playbackInfo(videoId: string): Promise<Video.Playback> {
            const { video } = await rev.get(`/api/v2/videos/${videoId}/playback-url`);
            return video;
        },
        ...videoDownloadAPI(rev),
        ...videoReportAPI(rev),
        async trim(videoId: string, removedSegments: Array<{ start: string, end: string }>) {
            return rev.post(`/api/v2/videos/${videoId}/trim`, removedSegments);
        }
    };
    return videoAPI;
}
