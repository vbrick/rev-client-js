import { RevError } from '../rev-error';
import type { RevClient } from '../rev-client';
import type { Rev } from '../types/index';
import { Webcast } from '../types/webcast';
import { RateLimitEnum } from '../utils';
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

/** @category Webcasts */
export class RealtimeReportRequest<T extends Webcast.RealtimeSession = Webcast.RealtimeSession> extends SearchRequest<T> {
    /**
     * The overall summary statistics returned with the first page of results
     */
    declare summary: Webcast.RealtimeSummary;
    /**
     * @hidden
     * @param rev
     * @param eventId
     * @param query
     * @param options
     */
    constructor(rev: RevClient, eventId: string, query: Webcast.RealtimeRequest = {}, options: Rev.SearchOptions<T> = {}) {
        const searchDefinition: Rev.SearchDefinition<T> = {
            endpoint: `/api/v2/scheduled-events/${eventId}/real-time/attendees`,
            totalKey: 'total',
            hitsKey: 'attendees',
            // get summary from initial response
            request: async (endpoint, query, options) => {
                await rev.session.queueRequest(RateLimitEnum.GetWebcastAttendeesRealtime);
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

/** @category Webcasts */
export class PostEventReportRequest extends SearchRequest<Webcast.PostEventSession> {
    declare summary: Webcast.PostEventSummary;
    /**
     * @hidden
     * @param rev
     * @param query
     * @param options
     */
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
                    // this endpoint has a particular error response that isn't automatically captured
                    // by the RevError parser, so need to manually check
                    const response = await rev.request<Webcast.PostEventSummary>('GET', endpoint, query, {
                        ...options,
                        responseType: 'json',
                        throwHttpErrors: false
                    });

                    // will throw on error response
                    await this._assertResponseOk(response);

                    // get summary removes scrollId and other internal data
                    Object.assign(this.summary, getSummaryFromResponse(response.body, 'sessions'));
                    return response.body;
                }
        };
        super(rev, searchDefinition,  runQuery, options);
        this.summary = {};
    }
    private async _assertResponseOk({response, statusCode, body}: Rev.Response<Webcast.PostEventSummary>): Promise<Webcast.PostEventSummary> {
        if (response.ok) {
            return body;
        }

        if (statusCode == 400 && (body as PostEventErrorResponse)?.errorDescription) {
            throw new RevError(response, { details: (body as PostEventErrorResponse).errorDescription });
        }
        // bodyUsed should always be true, but this is just a safety check
        const error = (!!body || response.bodyUsed)
            ? new RevError(response, body as string)
            : await RevError.create(response);
        throw error;
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


interface PostEventErrorResponse {
    errorDescription: string;
    sessions: [],
    totalSessions: 0
}

/**
 * The Post Event Report returns a special JSON body on 400 error, unlike other endpoints
 */
async function parseAttendeesError(revResponse: Rev.Response<unknown>) {

}
