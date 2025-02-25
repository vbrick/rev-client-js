import { Video } from './video';

/** @category Videos */
export namespace Recording {
    export interface PresentationProfileRequest {
        presentationProfileId: string,
        useAccountRecordingDevice?: boolean,
        startDate?: string | Date,
        endDate?: string | Date,
        title?: string;
    }
    export interface PresentationProfileStatus {
        startDate: string,
        endDate: string,
        status: Video.StatusEnum;
    }
    export interface StopPresentationProfileResponse {
        recordingVideoId: string,
        status: Video.StatusEnum;
    }
}
