import { Recording } from '../types/index';
import type { RevClient } from '../rev-client';
import { Video } from '../types/video';
import { isPlainObject } from '../utils';

/** @ignore */
export type API = ReturnType<typeof recordingAPIFactory>;

/**
 * Recording-related API methods
 * @category Videos
 * @group API
 * @see [Recording API Docs](https://revdocs.vbrick.com/reference/startrecording)
 */
export interface RecordingAPI extends API {}

/** @ignore */
export default function recordingAPIFactory(rev: RevClient) {
    const recordingAPI = {
        async startVideoConferenceRecording(sipAddress: string, sipPin: string, title?: string): Promise<string> {
            const { videoId } = await rev.post('/api/v2/vc/start-recording', { title, sipAddress, sipPin }, { responseType: 'json' });
            return videoId;
        },
        async getVideoConferenceStatus(videoId: string): Promise<Video.StatusEnum> {
            const { status } = await rev.get(`/api/v2/vc/recording-status/${videoId}`, undefined, { responseType: 'json' });
            return status;
        },
        async stopVideoConferenceRecording(videoId: string): Promise<string> {
            const payload = { videoId };
            const result = await rev.post(`/api/v2/vc/stop-recording`, payload, { responseType: 'json' });
            return isPlainObject<{ message: string; }>(result)
                ? result.message
                : result;
        },
        async startPresentationProfileRecording(request: Recording.PresentationProfileRequest): Promise<string> {
            const { scheduledRecordingId } = await rev.post('/api/v2/pp/start-recording', request, { responseType: 'json' });
            return scheduledRecordingId;
        },
        async getPresentationProfileStatus(recordingId: string): Promise<Recording.PresentationProfileStatus> {
            const result = await rev.get(`/api/v2/pp/recording-status/${recordingId}`, undefined, { responseType: 'json' });
            return result;
        },
        async stopPresentationProfileRecording(recordingId: string): Promise<Recording.StopPresentationProfileResponse> {
            const payload = { scheduledRecordingId: recordingId };
            const result = await rev.get(`/api/v2/vc/recording-status`, payload, { responseType: 'json' });
            return result;
        }
    };
    return recordingAPI;
}
