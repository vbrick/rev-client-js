import type { RevClient } from '../rev-client';
import type { Rev, Video } from '../types';
import { RateLimitEnum, asValidDate, isPlainObject } from '../utils';
import { IPageResponse, PagedRequest } from '../utils/paged-request';


const DEFAULT_INCREMENT: number = 30;
const DEFAULT_SORT: Rev.SortDirection = 'asc';

function addDays(date: Date, numDays: number) {
    const d = new Date(date.getTime());
    d.setDate(d.getDate() + numDays);
    return d;
}

function parseOptions(options: Video.VideoReportOptions) {
    let {
        incrementDays = DEFAULT_INCREMENT,
        sortDirection = DEFAULT_SORT,
        videoIds,
        startDate,
        endDate,
        ...otherOptions
    } = options;

    // clamp increment to 1 minute - 30 days range
    incrementDays = Math.min(
        Math.max(
            1 / 24 / 60,
            parseFloat(incrementDays as any) || DEFAULT_INCREMENT
        ),
        30
    );

    // API expects videoIds as a string
    if (Array.isArray(videoIds)) {
        videoIds = videoIds
            .map(s => s.trim())
            .filter(Boolean)
            .join(',');
    }

    return {
        incrementDays, sortDirection, videoIds,
        ...parseDates(startDate, endDate),
        ...otherOptions
    };
}

function parseDates(startArg: string | Date | undefined, endArg: string | Date | undefined) {
    const now = new Date();
    let startDate = asValidDate(startArg);
    let endDate = asValidDate(endArg);

    // if no end date set then use now, or startDate + 30 days
    if (!endDate) {
        if (startDate) {
            endDate = addDays(startDate, 30);
            if (endDate.getTime() > now.getTime()) {
                endDate = now;
            }
        } else {
            endDate = now;
        }
    }
    // if no start/beginning date then use end - 30 days
    if (!startDate)
    {
        startDate = addDays(endDate, -30);
    }

    // make sure times aren't swapped
    if (startDate.getTime() > endDate.getTime()) {
        [startDate, endDate] = [endDate, startDate];
    }
    return { startDate, endDate };
}

export class VideoReportRequest extends PagedRequest<Video.VideoReportEntry> {
    declare options: Required<ReturnType<typeof parseOptions>>;
    private _rev: RevClient;
    private _endpoint: string;
    constructor(rev: RevClient, options: Video.VideoReportOptions = {}, endpoint = "/api/v2/videos/report") {
        super(parseOptions(options));
        this._endpoint = endpoint;

        this._rev = rev;
    }
    protected async _requestPage() {
        const { startDate, endDate } = this;
        const {incrementDays, sortDirection, videoIds } = this.options;
        const isAscending = sortDirection === 'asc';

        let rangeStart = startDate;
        let rangeEnd = endDate;
        let done = false;

        if (isAscending) {
            rangeEnd = addDays(rangeStart, incrementDays);
            //
            if (rangeEnd >= endDate) {
                done = true;
                rangeEnd = endDate;
            }
        } else {
            rangeStart = addDays(rangeEnd, -1 * incrementDays);
            if (rangeStart <= startDate)
            {
                done = true;
                rangeStart = startDate;
            }
        }

        const query: Record<string, string> = {
            after: rangeStart.toJSON(),
            before: rangeEnd.toJSON()
        };
        if (videoIds) {
            query.videoIds = videoIds;
        }
        await this._rev.session.queueRequest(RateLimitEnum.GetVideoViewReport);
        const items: Video.VideoReportEntry[] = await this._rev.get(this._endpoint, query, { responseType: "json" });

        // go to next date range
        if (!done) {
            if (isAscending) {
                this.startDate = rangeEnd;
            } else {
                this.endDate = rangeStart;
            }
        }

        return {
            items,
            done
        };
    }
    get startDate() { return this.options.startDate; }
    set startDate(value) { this.options.startDate = value; }
    get endDate() { return this.options.endDate; }
    set endDate(value) { this.options.endDate = value; }
}

export function videoReportAPI(rev: RevClient) {
    function report(options?: Video.VideoReportOptions): VideoReportRequest;
    function report(videoId: string, options?: Video.VideoReportOptions): VideoReportRequest;
    function report(videoId?: string | Video.VideoReportOptions, options: Video.VideoReportOptions = {}): VideoReportRequest {
        if (isPlainObject(videoId)) {
            options = videoId;
        } else if (typeof videoId === 'string') {
            options = {
                ...(options ?? {}),
                videoIds: videoId
            };
        }
        return new VideoReportRequest(rev, options, '/api/v2/videos/report');
    }
    function summaryStatistics(videoId: string, startDate?: undefined, endDate?: undefined, options?: Rev.RequestOptions): Promise<Video.SummaryStatistics>;
    function summaryStatistics(videoId: string, startDate: Date | string, endDate?: undefined, options?: Rev.RequestOptions): Promise<Video.SummaryStatistics>;
    function summaryStatistics(videoId: string, startDate: Date | string, endDate: Date | string, options?: Rev.RequestOptions): Promise<Video.SummaryStatistics>;
    function summaryStatistics(videoId: string, startDate?: Date | string, endDate: Date | string | undefined = new Date(), options?: Rev.RequestOptions): Promise<Video.SummaryStatistics> {
        const payload = startDate
            ? { after: new Date(startDate).toISOString(), before: new Date(endDate ?? Date.now()) }
            : undefined;
        return rev.get(`/api/v2/videos/${videoId}/summary-statistics`, payload, options);
    }
    return {
        report,
        uniqueSessionsReport(videoId: string, options: Video.UniqueSessionReportOptions = {}) {
            return new VideoReportRequest(rev, options, `/api/v2/videos/${videoId}/report`);
        },
        summaryStatistics
    };
}
