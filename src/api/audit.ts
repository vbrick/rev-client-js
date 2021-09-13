import type { RevClient } from '../rev-client';
import type { Audit, Rev } from '../types';
import { tryParseJson } from '../utils';
import { parseCSV } from '../utils/parse-csv';

export default function auditAPIFactory(rev: RevClient) {
    const auditAPI = {
        /**
        * Logs of user login / logout / failed login activity
        */
        accountAccess(accountId: string, options?: Audit.Options<Audit.UserAccessEntry>) {
            return new AuditRequest<Audit.UserAccessEntry>(rev, `/network/audit/accounts/${accountId}/userAccess`, 'UserAccess', options);
        },
        userAccess(userId: string, accountId: string, options?: Audit.Options<Audit.UserAccessEntry>) {
            return new AuditRequest<Audit.UserAccessEntry>(rev, `/network/audit/accounts/${accountId}/userAccess/${userId}`, `UserAccess_${userId}`, options);
        },
        /**
        * Operations on User Records (create, delete, etc)
        */
        accountUsers(accountId: string, options?: Audit.Options<Audit.UserEntry>) {
            return new AuditRequest<Audit.UserEntry>(rev, `/network/audit/accounts/${accountId}/userAccess`, 'User', options);
        },
        user(userId: string, accountId: string, options?: Audit.Options<Audit.UserEntry>) {
            return new AuditRequest<Audit.UserEntry>(rev, `/network/audit/accounts/${accountId}/userAccess/${userId}`, 'User', options);
        },
        /**
        * Operations on Group Records (create, delete, etc)
        */
        accountGroups(accountId: string, options?: Audit.Options<Audit.GroupEntry>) {
            return new AuditRequest<Audit.GroupEntry>(rev, `/network/audit/accounts/${accountId}/groups`, 'Groups', options);
        },
        group(groupId: string, accountId: string, options?: Audit.Options<Audit.GroupEntry>) {
            return new AuditRequest<Audit.GroupEntry>(rev, `/network/audit/accounts/${accountId}/groups/${groupId}`, 'Group', options);
        },
        /**
        * Operations on Device Records (create, delete, etc)
        */
        accountDevices(accountId: string, options?: Audit.Options<Audit.DeviceEntry>) {
            return new AuditRequest<Audit.DeviceEntry>(rev, `/network/audit/accounts/${accountId}/devices`, 'Devices', options);
        },
        device(deviceId: string, accountId: string, options?: Audit.Options<Audit.DeviceEntry>) {
            return new AuditRequest<Audit.DeviceEntry>(rev, `/network/audit/accounts/${accountId}/devices/${deviceId}`, 'Device', options);
        },
        /**
        * Operations on Video Records (create, delete, etc)
        */
        accountVideos(accountId: string, options?: Audit.Options<Audit.VideoEntry>) {
            return new AuditRequest<Audit.VideoEntry>(rev, `/network/audit/accounts/${accountId}/videos`, 'Videos', options);
        },
        video(videoId: string, accountId: string, options?: Audit.Options<Audit.VideoEntry>) {
            return new AuditRequest<Audit.VideoEntry>(rev, `/network/audit/accounts/${accountId}/videos/${videoId}`, 'Video', options);
        },
        /**
        * Operations on Webcast Records (create, delete, etc)
        */
        accountWebcasts(accountId: string, options?: Audit.Options<Audit.WebcastEntry>) {
            return new AuditRequest<Audit.WebcastEntry>(rev, `/network/audit/accounts/${accountId}/scheduledEvents`, 'Webcasts', options);
        },
        webcast(eventId: string, accountId: string, options?: Audit.Options<Audit.WebcastEntry>) {
            return new AuditRequest<Audit.WebcastEntry>(rev, `/network/audit/accounts/${accountId}/scheduledEvents/${eventId}`, `Webcast`, options);
        },
        /**
        * All operations a single user has made
        */
        principal(userId: string, accountId: string, options?: Audit.Options<Audit.Entry<string>>) {
            return new AuditRequest<Audit.Entry<string>>(rev, `/network/audit/accounts/${accountId}/principals/${userId}`, 'Principal', options);
        }
    };

    return auditAPI;
}

function asValidDate(val: string | Date | undefined, defaultValue: Date): Date {
    if (!val) {
        return defaultValue;
    }
    if (!(val instanceof Date)) {
        val = new Date(val);
    }
    return isNaN(val.getTime())
    ? defaultValue
    : val;
}

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

export class AuditRequest<T extends Audit.Entry> implements Rev.ISearchRequest<T> {
    current: number;
    total: number;
    done: boolean;
    options: Required<Omit<Audit.Options<T>, 'toDate' | 'fromDate'>>;
    private params: {
        toDate?: string,
        fromDate?: string,
        nextContinuationToken?: string;
    }
    private _req: () => Promise<Rev.Response<any>>;
    constructor(rev: RevClient, endpoint: string, label: string, options: Audit.Options<T> = {}) {
        const {
            fromDate,
            toDate,
            ...opts
        } = options;

        this.options = {
            maxResults: Infinity,
            onProgress: (items: T[], current: number, total: number) => {
                rev.log('debug', `loading ${label}, ${current} of ${total}...`);
            },
            ...opts
        };

        let _toDate = asValidDate(toDate, new Date());
        // default to one year older than toDate
        const defaultFrom = new Date(_toDate.setFullYear(_toDate.getFullYear() - 1));
        let _fromDate = asValidDate(fromDate, defaultFrom);

        if (_toDate < _fromDate) {
            [_toDate, _fromDate] = [_fromDate, _toDate];
        }

        this.params = {
            toDate: _toDate.toISOString(),
            fromDate: _fromDate.toISOString()
        };

        this._req = () => rev.request('GET', endpoint, { params: this.params }, { responseType: 'text' });

        this.current = 0;
        this.total = Infinity;
        this.done = false;
    }
    async nextPage() {
        const {
            maxResults,
            onProgress
        } = this.options;

        let current = this.current;

        const response = await this._req();
        const {
            body,
            headers
        } = response;

        let items = parseCSV(body)
            .map(line => parseEntry<T>(line));

        if (!this.total) {
            const totalRecords = parseInt(headers.get('totalRecords') || '', 10);
            this.total = Math.min(totalRecords || 0, maxResults);
        }

        Object.assign(this.params, {
            nextContinuationToken: headers.get('nextContinuationToken') || undefined,
            fromDate: headers.get('nextfromDate') || undefined
        });
        if (!this.params.nextContinuationToken) {
            this.done = true;
        }

        // limit results to specified max results
        if (current + items.length >= maxResults) {
            const delta = maxResults - current;
            items = items.slice(0, delta);
            this.done = true;
        }

        onProgress(items, current, this.total);

        this.current += items.length;

        if (this.current === this.total) {
            this.done = true;
        }

        return {
            current,
            total: this.total,
            done: this.done,
            items
        };
    }
    /**
     * Go through all pages of results and return as an array.
     * TIP: Use the {maxResults} option to limit the maximum number of results
     *
     */
    async exec(): Promise<T[]> {
        const results: T[] = [];
        // use async iterator
        for await (let hit of this) {
            results.push(hit);
        }
        return results;
    }
    async* [Symbol.asyncIterator]() {
        do {
            const {
                items
            } = await this.nextPage();

            for await (let hit of items) {
                yield hit;
            }
        } while (!this.done);
    }
}
