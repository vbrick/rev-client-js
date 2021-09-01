import { Rev } from '..';
import type { RevClient } from '../rev-client';
import { Webcast } from '../types/webcast';
import { searchScrollStream } from '../utils/request-utils';

export default function webcastAPIFactory(rev: RevClient) {
    const webcastAPI = {
        async list(options: Webcast.ListRequest = { }): Promise<Webcast[]> {
            return rev.get('/api/v2/scheduled-events', options, { responseType: 'json' });
        },
        async search(query: Webcast.SearchRequest, options?: Rev.SearchOptions<Webcast>) {
            const results: Webcast[] = [];
            const pager = webcastAPI.searchStream(query, options);
            for await (const session of pager) {
                results.push(session);
            }
            return results;
        },
        * searchStream(query: Webcast.SearchRequest, options?: Rev.SearchOptions<Webcast>) {
            const searchDefinition = {
                endpoint: `/api/v2/search/scheduled-events`,
                totalKey: 'total',
                hitsKey: 'events',
                isPost: true
            };
            return searchScrollStream<Webcast>(rev, searchDefinition, query, options);
        },
        async create(event: Webcast.CreateRequest): Promise<string> {
            const { eventId } = await rev.post(`/api/v2/scheduled-events`, event);
            return eventId;
        },
        async details(eventId: string): Promise<Webcast.Details> {
            return rev.get(`/api/v2/scheduled-events/${eventId}`);
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
        async attendees(eventId: string, runNumber?: number, options?: Rev.SearchOptions<Webcast.PostEventSession>): Promise<Webcast.PostEventSession[]> {
            const searchDefinition = {
                endpoint: `/api/v2/scheduled-events/${eventId}/post-event-report`,
                totalKey: 'totalSessions',
                hitsKey: 'sessions'
            };
            const query = runNumber >= 0 ? { runNumber } : { };
            const results: Webcast.PostEventSession[] = [];
            const pager = searchScrollStream<Webcast.PostEventSession>(rev, searchDefinition, query, options);
            for await (const session of pager) {
                results.push(session);
            }
            return results;
        },
        async questions(eventId: string, runNumber?: number): Promise<Webcast.Question[]> {
            const query = runNumber >= 0 ? { runNumber } : { };
            return rev.get(`/api/v2/scheduled-events/${eventId}/questions`, query, { responseType: 'json' });
        },
        async pollResults(eventId: string, runNumber?: number): Promise<Webcast.PollResults[]> {
            const query = runNumber >= 0 ? { runNumber } : { };
            return rev.get(`/api/v2/scheduled-events/${eventId}/poll-results`, query, { responseType: 'json' });
        },
        async comments(eventId: string, runNumber?: number): Promise<Webcast.Comment[]> {
            const query = runNumber >= 0 ? { runNumber } : { };
            return rev.get(`/api/v2/scheduled-events/${eventId}/comments`, query, { responseType: 'json' });
        },
        async status(eventId: string): Promise<Webcast.Status> {
            return rev.get(`/api/v2/scheduled-events/${eventId}/status`);
        },
        async playbackUrl(eventId: string, options: Webcast.PlaybackUrlRequest = { }): Promise<Webcast.Playback[]> {
            const {
                ip,
                userAgent
            } = options;

            const query = ip ? { ip } : undefined;

            const requestOptions: Rev.RequestOptions = {
                responseType: 'json'
            };
            if (userAgent) {
                requestOptions.headers = { 'User-Agent': userAgent };
            }

            return rev.get(`/api/v2/scheduled-events/${eventId}/playback-url`, query, requestOptions);
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
        }
    };
    return webcastAPI;
}
