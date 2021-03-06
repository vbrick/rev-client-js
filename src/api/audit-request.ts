import { RevClient } from '..';
import { Audit } from '../types';
import { asValidDate, tryParseJson } from '../utils';
import { IPageResponse, PagedRequest } from '../utils/paged-request';
import { parseCSV } from '../utils/parse-csv';

function parseEntry<T extends Audit.Entry>(line: Record<string, any>): T {
    return {
        messageKey: line['MessageKey'],
        entityKey: line['EntityKey'],
        when: line['When'],
        principal: tryParseJson(line['Principal']) || {},
        message: tryParseJson(line['Message']) || {},
        currentState: tryParseJson(line['CurrentState']) || {},
        previousState: tryParseJson(line['PreviousState']) || {}
    } as T;
}

export class AuditRequest<T extends Audit.Entry> extends PagedRequest<T> {
    declare options: Required<Omit<Audit.Options<T>, 'toDate' | 'fromDate'>>;
    private params: {
        toDate?: string,
        fromDate?: string,
        nextContinuationToken?: string;
    }
    private _req: () => Promise<IPageResponse<T>>;
    constructor(
        rev: RevClient,
        endpoint: string,
        label: string = 'audit records',
        {toDate, fromDate, ...options}: Audit.Options<T> = {}
    ) {
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

        this._req = this._buildReqFunction(rev, endpoint);
    }
    protected _requestPage() { return this._req(); }
    private _buildReqFunction(rev: RevClient, endpoint: string) {
        return async () => {
            const response = await rev.request('GET', endpoint, { params: this.params }, { responseType: 'text' });

            const {
                body,
                headers
            } = response;

            let items = parseCSV(body)
                .map(line => parseEntry<T>(line));

            const total = parseInt(headers.get('totalRecords') || '', 10);

            Object.assign(this.params, {
                nextContinuationToken: headers.get('nextContinuationToken') || undefined,
                fromDate: headers.get('nextfromDate') || undefined
            });

            let done = !this.params.nextContinuationToken;


            return {
                items,
                total,
                done
            } as IPageResponse<T>;
        }
    }
    private _parseDates(fromDate?: Date | string, toDate?: Date | string) {
        let to = asValidDate(toDate, new Date());

        // default to one year older than toDate
        const defaultFrom = new Date(to.setFullYear(to.getFullYear() - 1));

        let from = asValidDate(fromDate, defaultFrom);

        if (to < from) {
            [to, from] = [from, to];
        }
        return {from, to};
    }
}
