import { Rev } from '..';
import type { RevClient } from '../rev-client';
import { Webcast, GuestRegistration, WebcastBanner } from '../types/webcast';
import { SearchRequest } from '../utils/request-utils';
import { titleCase } from '../utils';
import { PostEventReportRequest, RealtimeReportRequest } from './webcast-report-request';
import { mergeHeaders } from '../utils/merge-headers';

type RealtimeSession<T extends Webcast.RealtimeRequest | undefined> = T extends { attendeeDetails: 'All' }
    ? Webcast.RealtimeSessionDetail
    : T extends { attendeeDetails: 'Counts' }
    ? never
    : Webcast.RealtimeSession;

export default function webcastAPIFactory(rev: RevClient) {
    const webcastAPI = {
        async list(options: Webcast.ListRequest = { }, requestOptions?: Rev.RequestOptions): Promise<Webcast[]> {
            return rev.get('/api/v2/scheduled-events', options, { ...requestOptions, responseType: 'json' });
        },
        search(query: Webcast.SearchRequest, options?: Rev.SearchOptions<Webcast>): Rev.ISearchRequest<Webcast> {
            const searchDefinition: Rev.SearchDefinition<Webcast> = {
                endpoint: `/api/v2/search/scheduled-events`,
                totalKey: 'total',
                hitsKey: 'events',
                request: (endpoint, query, options) => rev.post(endpoint, query, options),
                isPost: true
            };
            return new SearchRequest<Webcast>(rev, searchDefinition, query, options);
        },
        async create(event: Webcast.CreateRequest): Promise<string> {
            const { eventId } = await rev.post(`/api/v2/scheduled-events`, event);
            return eventId;
        },
        async details(eventId: string, requestOptions?: Rev.RequestOptions): Promise<Webcast.Details> {
            return rev.get(`/api/v2/scheduled-events/${eventId}`, undefined, requestOptions);
        },
        async edit(eventId: string, event: Webcast.CreateRequest): Promise<void> {
            return rev.put(`/api/v2/scheduled-events/${eventId}`, event);
        },
        // async patch - not yet implemented
        async delete(eventId: string): Promise<void> {
            return rev.delete(`/api/v2/scheduled-events/${eventId}`);
        },
        async editAccess(eventId: string, entities: Webcast.EditAttendeesRequest): Promise<void> {
            return rev.put(`/api/v2/scheduled-events/${eventId}/access-control`, entities);
        },
        attendees(
            eventId: string,
            runNumber?: number,
            options?: Rev.SearchOptions<Webcast.PostEventSession>
        ) {
            return new PostEventReportRequest(rev, { eventId, runNumber }, options);
        },
        realtimeAttendees<T extends Webcast.RealtimeRequest | undefined>(
            eventId: string,
            query?: T,
            options?: Rev.SearchOptions<RealtimeSession<T>>
        ) {
            return new RealtimeReportRequest<RealtimeSession<T>>(rev, eventId, query, options);
        },
        async questions(eventId: string, runNumber?: number): Promise<Webcast.Question[]> {
            const query = (runNumber ?? -1) >= 0 ? { runNumber } : {};
            return rev.get(`/api/v2/scheduled-events/${eventId}/questions`, query, { responseType: 'json' });
        },
        async pollResults(eventId: string, runNumber?: number): Promise<Webcast.PollResults[]> {
            const query = (runNumber ?? -1) >= 0 ? { runNumber } : {};
            // const {polls} = await rev.get(`/api/v2/scheduled-events/${eventId}/poll-results`, query, { responseType: 'json' });
            // workaround for event that never happened returning blank response
            const rawResponse = await rev.get(`/api/v2/scheduled-events/${eventId}/poll-results`, query, { responseType: 'text' });
            const {polls = []} = rawResponse ? JSON.parse(rawResponse) : {};
            return polls;
        },
        async comments(eventId: string, runNumber?: number): Promise<Webcast.Comment[]> {
            const query = (runNumber ?? -1) >= 0 ? { runNumber } : {};
            return rev.get(`/api/v2/scheduled-events/${eventId}/comments`, query, { responseType: 'json' });
        },
        async reactions(eventId: string): Promise<Webcast.ReactionsSummary[]> {
            return rev.get(`/api/v2/scheduled-events/${eventId}/reactions`, undefined, { responseType: 'json' });
        },
        async status(eventId: string, requestOptions?: Rev.RequestOptions): Promise<Webcast.Status> {
            return rev.get(`/api/v2/scheduled-events/${eventId}/status`, undefined, requestOptions);
        },
        async isPublic(eventId: string, requestOptions?: Rev.RequestOptions): Promise<boolean> {
            const response = await rev.request('GET', `/api/v2/scheduled-events/${eventId}/is-public`, undefined, { ...requestOptions, throwHttpErrors: false, responseType: 'json' });
            return response.statusCode !== 401 && response.body?.isPublic;
        },
        async playbackUrls(eventId: string, {ip, userAgent}: Webcast.PlaybackUrlRequest = { }, options?: Rev.RequestOptions): Promise<Webcast.PlaybackUrlsResponse> {
            const query = ip ? { ip } : undefined;

            const opts: Rev.RequestOptions = {
                ...options,
                ...userAgent && {
                    headers: mergeHeaders(options?.headers, { 'User-Agent': userAgent })
                },
                responseType: 'json'
            };

            return rev.get(`/api/v2/scheduled-events/${eventId}/playback-url`, query, opts);
        },
        /**
         * @deprecated
         * @param eventId
         * @param options
         * @returns
         */
        async playbackUrl(eventId: string, options: Webcast.PlaybackUrlRequest = { }): Promise<Webcast.Playback[]> {
            rev.log('debug', 'webcast.playbackUrl is deprecated - use webcast.playbackUrls instead');
            const {playbackResults} = await webcastAPI.playbackUrls(eventId, options);
            return playbackResults;
        },
        async startEvent(eventId: string, preProduction: boolean = false): Promise<void> {
            await rev.put(`/api/v2/scheduled-events/${eventId}/start`, { preProduction });
        },
        async stopEvent(eventId: string, preProduction: boolean = false): Promise<void> {
            await rev.delete(`/api/v2/scheduled-events/${eventId}/start`, { preProduction });
        },
        async startBroadcast(eventId: string): Promise<void> {
            await rev.put(`/api/v2/scheduled-events/${eventId}/broadcast`);
        },
        async stopBroadcast(eventId: string): Promise<void> {
            await rev.delete(`/api/v2/scheduled-events/${eventId}/broadcast`);
        },
        async startRecord(eventId: string): Promise<void> {
            await rev.put(`/api/v2/scheduled-events/${eventId}/record`);
        },
        async stopRecord(eventId: string): Promise<void> {
            await rev.delete(`/api/v2/scheduled-events/${eventId}/record`);
        },
        async linkVideo(eventId: string, videoId: string, autoRedirect: boolean = true) {
            const payload = {
                videoId,
                redirectVod: autoRedirect
            };
            return rev.put(`/api/v2/scheduled-events/${eventId}/linked-video`, payload);
        },
        async unlinkVideo(eventId: string) {
            return rev.delete(`/api/v2/scheduled-events/${eventId}/linked-video`);
        },
        /**
         * Retrieve details of a specific guest user Public webcast registration.
         * @param eventId - Id of the Public webcast
         * @param registrationId - Id of guest user's registration to retrieve
         * @returns
         */
        async guestRegistration(eventId: string, registrationId: string): Promise<GuestRegistration.Details> {
            return rev.get(`/api/v2/scheduled-events/${eventId}/registrations/${registrationId}`);
        },
        /**
         * Mute attendee for a specified webcast
         */
        async muteAttendee(eventId: string, userId: string, runNumber?: number): Promise<void> {
            const query = (runNumber ?? -1) >= 0 ? { runNumber } : {};
            await rev.put(`/api/v2/scheduled-events/${eventId}/users/${userId}/mute`, query);
        },
        /**
         * Unmute attendee for a specified webcast
         */
        async unmuteAttendee(eventId: string, userId: string, runNumber?: number): Promise<void> {
            const query = (runNumber ?? -1) >= 0 ? { runNumber } : {};
            await rev.delete(`/api/v2/scheduled-events/${eventId}/users/${userId}/mute`, query);
        },
        /**
         * Hide specific comment for a specified webcast
         */
        async hideComment(eventId: string, commentId: string, runNumber?: number): Promise<void> {
            const query = (runNumber ?? -1) >= 0 ? { runNumber } : {};
            await rev.put(`/api/v2/scheduled-events/${eventId}/comments/${commentId}/hide`, query);
        },
        /**
         * Unhide specific comment for a specified webcast
         */
        async unhideComment(eventId: string, commentId: string, runNumber?: number): Promise<void> {
            const query = (runNumber ?? -1) >= 0 ? { runNumber } : {};
            await rev.delete(`/api/v2/scheduled-events/${eventId}/comments/${commentId}/hide`, query);
        },
        /**
         * Register one attendee/guest user for an upcoming Public webcast. Make sure you first enable Public webcast pre-registration before adding registrations.
         * @param eventId
         * @param registration
         * @returns
         */
        async createGuestRegistration(eventId: string, registration: GuestRegistration.Request): Promise<GuestRegistration.Details> {
            return rev.post(`/api/v2/scheduled-events/${eventId}/registrations`, registration);
        },
        listGuestRegistrations(
            eventId: string,
            query: GuestRegistration.SearchRequest = {},
            options?: Rev.SearchOptions<GuestRegistration>
        ): Rev.ISearchRequest<GuestRegistration> {
            const searchDefinition: Rev.SearchDefinition<GuestRegistration> = {
                endpoint: `/api/v2/scheduled-events/${eventId}/registrations`,
                /** NOTE: this API doesn't actually return a total, so this will always be undefined */
                totalKey: 'total',
                hitsKey: 'guestUsers'
            };
            return new SearchRequest<GuestRegistration>(rev, searchDefinition, query, options);
        },
        updateGuestRegistration(eventId: string, registrationId: string, registration: GuestRegistration.Request): Promise<void> {
            return rev.put(`/api/v2/scheduled-events/${eventId}/registrations/${registrationId}`, registration);
        },
        patchGuestRegistration(eventId: string, registrationId: string, registration: Partial<GuestRegistration.Request>): Promise<void> {
            const operations = Object.entries(registration)
                .map(([key, value]) => {
                    let path = `/${titleCase(key)}`;
                    return { op: 'replace', path, value };
                });
            return rev.put(`/api/v2/scheduled-events/${eventId}/registrations/${registrationId}`, operations);
        },
        deleteGuestRegistration(eventId: string, registrationId: string): Promise<void> {
            return rev.delete(`/api/v2/scheduled-events/${eventId}/registrations/${registrationId}`);
        },
        async listBanners(eventId: string): Promise<WebcastBanner[]> {
            const {banners} = await rev.get(`/api/v2/scheduled-events/${eventId}/banners`);
            return banners || [];
        },
        addBanner(eventId: string, banner: WebcastBanner.Request): Promise<WebcastBanner> {
            return rev.post(`/api/v2/scheduled-events/${eventId}/banner`, banner);
        },
        setBannerStatus(eventId: string, bannerId: string, isEnabled: boolean): Promise<void> {
            return rev.put(`/api/v2/scheduled-events/${eventId}/banner/${bannerId}/status`, {isEnabled});
        },
        updateBanner(eventId: string, banner: WebcastBanner): Promise<WebcastBanner> {
            // separate id from the banner data
            const {id, ...payload} = banner;
            return rev.put(`/api/v2/scheduled-events/${eventId}/banner/${id}`, payload);
        },
        deleteBanner(eventId: string, bannerId: string): Promise<void> {
            return rev.delete(`/api/v2/scheduled-events/${eventId}/banner/${bannerId}`);
        }
    };

    return webcastAPI;
}
