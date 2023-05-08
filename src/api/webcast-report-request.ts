import type { RevClient } from '../rev-client';
import type { Rev } from '../types';
import { Webcast } from '../types/webcast';
import { SearchRequest } from '../utils/request-utils';

function getSummaryFromResponse<T extends Record<string, any>>(response: T, hitsKey: string) {
    const ignoreKeys = ['scrollId', 'statusCode', 'statusDescription'];

    const summary = Object.fromEntries(Object.entries(response)
        .filter(([key, value]) => {
            // don't include arrays or scroll type keys
            return !(key === hitsKey || ignoreKeys.includes(key) || Array.isArray(value));
        }));
    return summary;
}

export class RealtimeReportRequest<T extends Webcast.RealtimeSession = Webcast.RealtimeSession> extends SearchRequest<T> {
    declare summary: Webcast.RealtimeSummary;
    constructor(rev: RevClient, eventId: string, query: Webcast.RealtimeRequest = {}, options: Rev.SearchOptions<T> = {}) {
        const searchDefinition: Rev.SearchDefinition<T> = {
            endpoint: `/api/v2/scheduled-events/${eventId}/real-time/attendees`,
            totalKey: 'total',
            hitsKey: 'attendees',
            // get summary from initial response
            request: async (endpoint, query, options) => {
                const response = await rev.post<Webcast.RealtimeSummary>(endpoint, query, options);

                const summary = getSummaryFromResponse(response, 'attendees');
                Object.assign(this.summary, summary);
                return response;
            }
        };
        super(rev, searchDefinition, query, options);
        this.summary = {} as any;
    }
    /**
     * get the aggregate statistics only, instead of actual session data.
     * @returns {Webcast.PostEventSummary}
     */
    async getSummary() {
        // set maxResults to 0 to mark request as done, since first page of sessions will be lost
        this.options.maxResults = 0;
        // must get first page of results to load summary data
        await this.nextPage();
        return this.summary;
    }
}

export class PostEventReportRequest extends SearchRequest<Webcast.PostEventSession> {
    declare summary: Webcast.PostEventSummary;
    constructor(rev: RevClient, query: { eventId: string, runNumber?: number }, options: Rev.SearchOptions<Webcast.PostEventSession> = {}) {
        const { eventId, runNumber } = query;
        const runQuery = (runNumber && runNumber >= 0)
            ? { runNumber }
            : {};

        const searchDefinition: Rev.SearchDefinition<Webcast.PostEventSession> = {
            endpoint: `/api/v2/scheduled-events/${eventId}/post-event-report`,
                totalKey: 'totalSessions',
                hitsKey: 'sessions',
                request: async (endpoint, query, options) => {
                    const response = await rev.get<Webcast.PostEventSummary>(endpoint, query, options);

                    const summary = getSummaryFromResponse(response, 'sessions');
                    Object.assign(this.summary, summary);
                    return response;
                }
        };
        super(rev, searchDefinition,  runQuery, options);
        this.summary = {};
    }
    /**
     * get the aggregate statistics only, instead of actual session data.
     * @returns {Webcast.PostEventSummary}
     */
    async getSummary() {
        // set maxResults to 0 to mark request as done, since first page of sessions will be lost
        this.options.maxResults = 0;
        // must get first page of results to load summary data
        await this.nextPage();
        return this.summary;
    }
}
