import type { Rev, Video } from "../types";
import type { ExternalAccess } from '../types/video';
import { isPlainObject } from "../utils";
import type {RevClient} from "../rev-client";
import { SearchRequest } from "../utils/request-utils";

/** @ignore */
export function videoExternalAccessAPI(rev: RevClient) {
    return {
        /**
         *
         * @param videoId Id of video to submit emails for external access
         * @param q       Search string
         * @param options search options
         * @returns
         */
        listExternalAccess(videoId: string, q?: string, options?: Rev.SearchOptions<ExternalAccess>): Rev.ISearchRequest<ExternalAccess> {
            const searchDefinition: Rev.SearchDefinition<ExternalAccess> = {
                endpoint: `/api/v2/videos/${videoId}/external-access`,
                /** NOTE: this API doesn't actually return a total, so this will always be undefined */
                totalKey: 'total',
                hitsKey: 'items'
            };
            const payload = q ? {q} : undefined;
            return new SearchRequest<ExternalAccess>(rev, searchDefinition, payload, options);
        },
        async createExternalAccess(videoId: string, request: ExternalAccess.Request): Promise<void> {
            await rev.post(`/api/v2/videos/${videoId}/external-access`, request);
        },
        async renewExternalAccess(videoId: string, request: Pick<ExternalAccess.Request, 'emails' | 'noEmail'>): Promise<ExternalAccess.RenewResponse> {
            return rev.put(`/api/v2/videos/${videoId}/external-access`, request);
        },
        async deleteExternalAccess(videoId: string, request: Pick<ExternalAccess.Request, 'emails'>) {
            return rev.delete(`/api/v2/videos/${videoId}/external-access`, request);
        },
        async revokeExternalAccess(videoId: string, request: Pick<ExternalAccess.Request, 'emails'>) {
            return rev.put<void>(`/api/v2/videos/${videoId}/external-access/revoke`, request);
        }
    }
}
