import { RevError } from '../rev-error';
import type { RevClient } from '../rev-client';
import { Video, Rev, Admin } from '../types';
import { SearchRequest } from '../utils/request-utils';
import { videoReportAPI } from './video-report-request';
import { videoDownloadAPI } from './video-download';
import { RateLimitEnum, sleep } from '../utils';
import { mergeHeaders } from '../utils/merge-headers';
import { videoExternalAccessAPI } from './video-external-access';

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
            await rev.session.queueRequest(RateLimitEnum.UpdateVideoMetadata);
            await rev.patch(`/api/v2/videos/${videoId}`, payload);
        },
        /**
         * Use the Patch API to update a single Custom Field.
         * @param videoId - id of video to update
         * @param customField - the custom field object (with id and value)
         */
        async setCustomField(videoId: string, customField: Pick<Admin.CustomField, 'id' | 'value'>) {
            // LEGACY behavior, only relevant for Rev < 7.48
            // const payload = [
            //     { op: 'remove', path: '/customFields', value: customField.id },
            //     { op: 'add', path: '/customFields/-', value: customField }
            // ];
            const payload = [{
                op: 'replace',
                path: '/CustomFields',
                value: [customField]
            }];
            await rev.session.queueRequest(RateLimitEnum.UpdateVideoMetadata);
            await rev.patch(`/api/v2/videos/${videoId}`, payload);
        },
        async delete(videoId: string): Promise<void> {
            await rev.session.queueRequest(RateLimitEnum.UpdateVideoMetadata);
            await rev.delete(`/api/v2/videos/${videoId}`);
            // TIP: If delete returns a 401 then video has likely already been deleted
        },
        /**
         * get processing status of a video
         * @param videoId
         */
        async status(videoId: string): Promise<Video.StatusResponse> {
            return rev.get(`/api/v2/videos/${videoId}/status`);
        },
        async details(videoId: string): Promise<Video.Details> {
            await rev.session.queueRequest(RateLimitEnum.GetVideoDetails);
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
            const searchDefinition: Rev.SearchDefinition<Video.SearchHit> = {
                endpoint: '/api/v2/videos/search',
                totalKey: 'totalVideos',
                hitsKey: 'videos',
                async request(endpoint, query, options) {
                    await rev.session.queueRequest(RateLimitEnum.SearchVideos);
                    return rev.get(endpoint, query, options);
                }
            };
            const request = new SearchRequest<Video.SearchHit>(rev, searchDefinition, query, options);
            return request;
        },
        /**
         * Example of using the video search API to search for videos, then getting
         * the details of each video
         * @deprecated This method can cause timeouts if iterating through a very
         *             large number of results, as the search scroll cursor has a
         *             timeout of ~5 minutes. Consider getting all search results
         *             first, then getting details
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
                    const result: Array<Video.SearchHit & (Video.Details & { error?: Error; })> = [];
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
        async playbackUrls(videoId: string, {ip, userAgent}: Video.PlaybackUrlsRequest = {}, options?: Rev.RequestOptions): Promise<Video.PlaybackUrlsResponse> {
            const query = ip ? { ip } : undefined;

            const opts: Rev.RequestOptions = {
                ...options,
                ...userAgent && {
                    headers: mergeHeaders(options?.headers, { 'User-Agent': userAgent })
                },
                responseType: 'json'
            };

            return rev.get(`/api/v2/videos/${videoId}/playback-urls`, query, opts);
        },
        ...videoDownloadAPI(rev),
        ...videoReportAPI(rev),
        ...videoExternalAccessAPI(rev),
        async trim(videoId: string, removedSegments: Array<{ start: string, end: string }>) {
            await rev.session.queueRequest(RateLimitEnum.UploadVideo);
            return rev.post(`/api/v2/videos/${videoId}/trim`, removedSegments);
        },
        async convertDualStreamToSwitched(videoId: string) {
            await rev.session.queueRequest(RateLimitEnum.UpdateVideoMetadata);
            return rev.put<void>(`/api/v2/videos/${videoId}/convert-dual-streams-to-switched-stream`);
        },
        async patch(videoId: string, operations: Rev.PatchOperation[]) {
            await rev.session.queueRequest(RateLimitEnum.UpdateVideoMetadata);
            await rev.patch(`/api/v2/videos/${videoId}`, operations);
        },
        /**
         * Helper - wait for video transcode to complete.
         * This doesn't indicate that a video is playable, rather that all transcoding jobs are complete
         * @param videoId
         * @param options
         */
        async waitTranscode(videoId: string, options: Video.WaitTranscodeOptions): Promise<Video.StatusResponse> {
            const {
                pollIntervalSeconds = 30,
                timeoutMinutes = 240,
                signal,
                ignorePlaybackWhileTranscoding = true,
                onProgress,
                onError = (error: Error) => { throw error; }
            } = options;

            const ONE_MINUTE = 1000 * 60;
            const timeoutDate = (Date.now() + (timeoutMinutes * ONE_MINUTE) || Infinity);
            // sanity check: ensure at least 5 seconds between calls
            const pollInterval = Math.max((pollIntervalSeconds || 30) * 1000, 5000);
            // set as failed initially in case no error thrown but times out
            let statusResponse = {status: 'UploadFailed'} as Video.StatusResponse;
            while (Date.now() < timeoutDate && !signal?.aborted) {
                // call video status API
                try {
                    statusResponse = await videoAPI.status(videoId);
                    let {
                        isProcessing,
                        overallProgress = 0,
                        status
                    } = statusResponse;

                    // status may be Ready initially even though about to go to Processing state
                    if (ignorePlaybackWhileTranscoding && status === 'Ready' && isProcessing) {
                        status = 'Processing';
                    }

                    // force failed processing as finished
                    if (status === 'ProcessingFailed') {
                        overallProgress = 1;
                        isProcessing = false;
                    }
                    // override API values as per above
                    Object.assign(statusResponse, { status, overallProgress, isProcessing });

                    onProgress?.(statusResponse);

                    // isProcessing is initially false, so wait till overallProgress changes to complete
                    if (overallProgress === 1 && !isProcessing) {
                        // finished, break out of loop
                        break;
                    }
                } catch (error) {
                    // by default will throw error
                    await Promise.resolve(onError(error as Error));
                }

                await sleep(pollInterval, signal);
            }
            return statusResponse;
        }
    };
    return videoAPI;
}
