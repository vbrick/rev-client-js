import { RevClient } from '../rev-client';
import { Audit } from '../types/index';
import { asValidDate, tryParseJson } from '../utils/index';
import { IPageResponse, PagedRequest } from '../utils/paged-request';
import { parseCSV } from '../utils/parse-csv';
import { RateLimitEnum, makeQueue } from '../utils/rate-limit-queues';

function parseEntry<T extends Audit.Entry>(line: Record<string, any>): T {
    return {
        messageKey: line['MessageKey'],
        entityKey: line['EntityKey'],
        when: line['When'],
        entityId: line['EntityId'],
        principal: tryParseJson(line['Principal']) || {},
        message: tryParseJson(line['Message']) || {},
        currentState: tryParseJson(line['CurrentState']) || {},
        previousState: tryParseJson(line['PreviousState']) || {}
    } as T;
}

/**
 * @category Audit
 */
export class AuditRequest<T extends Audit.Entry> extends PagedRequest<T> {
    declare options: Required<Omit<Audit.Options<T>, 'toDate' | 'fromDate'>>;
    private params: {
        toDate?: string,
        fromDate?: string,
        nextContinuationToken?: string;
    }
    private _req: () => Promise<IPageResponse<T>>;
    /**
     * @hidden
     * @param rev
     * @param endpoint
     * @param label
     * @param options
     */
    constructor(
        rev: RevClient,
        endpoint: string,
        label: string = 'audit records',
        {toDate, fromDate, beforeRequest, ...options}: Audit.Options<T> = {}
    ) {
        if (!toDate && 'endDate' in options) {
            throw new TypeError('Audit API uses toDate param instead of endDate');
        }
        if (!fromDate && 'startDate' in options) {
            throw new TypeError('Audit API uses fromDate param instead of startDate');
        }
        super({
            onProgress: (items: T[], current: number, total?: number | undefined) => {
                rev.log('debug', `loading ${label}, ${current} of ${total}...`);
            },
            ...options
        });

        const {from, to} = this._parseDates(fromDate, toDate);

        this.params = {
            toDate: to.toISOString(),
            fromDate: from.toISOString()
        };

        this._req = this._buildReqFunction(rev, endpoint, beforeRequest);
    }
    protected _requestPage() { return this._req(); }
    private _buildReqFunction(rev: RevClient, endpoint: string, beforeRequest?: (request: PagedRequest<T>) => Promise<void>) {
        return async () => {
            await beforeRequest?.(this);
            const response = await rev.request('GET', endpoint, this.params, { responseType: 'text' });

            const {
                body,
                headers
            } = response;

            let items = parseCSV(body)
                .map(line => parseEntry<T>(line));

            const remaining = parseInt(headers.get('totalRecords') || '', 10);

            Object.assign(this.params, {
                nextContinuationToken: headers.get('nextContinuationToken') || undefined,
                fromDate: headers.get('nextfromDate') || undefined
            });

            let done = !this.params.nextContinuationToken;


            return {
                items,
                // totalRecords for subsequent requests is the count return from current fromDate, rather than total for starting date range
                total: Math.max(this.total || 0, remaining),
                done
            } as IPageResponse<T>;
        }
    }
    private _parseDates(fromDate?: Date | string, toDate?: Date | string) {
        let to = asValidDate(toDate, new Date());

        // default to one year older than toDate
        const defaultFrom = new Date(to);
        defaultFrom.setFullYear(to.getFullYear() - 1);

        let from = asValidDate(fromDate, defaultFrom);

        if (to < from) {
            [to, from] = [from, to];
        }
        return {from, to};
    }
}
