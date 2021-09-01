import type { RevClient } from '../rev-client';
import type { Audit } from '../types';
import { tryParseJson } from '../utils';
import { parseCSV } from '../utils/parse-csv';

export default function auditAPIFactory(rev: RevClient) {
    const auditAPI = {
        /**
        * return audit endpoints as stream of items (AsyncIterator)
        */
        stream: {
            /**
            * Logs of user login / logout / failed login activity
            */
            accountAccess(accountId: string, options?: Audit.Options) {
                return scroll<'Network:UserAccess'>(`/network/audit/accounts/${accountId}/userAccess`, 'UserAccess', options);
            },
            userAccess(userId: string, accountId: string, options?: Audit.Options) {
                return scroll<'Network:UserAccess'>(`/network/audit/accounts/${accountId}/userAccess/${userId}`, `UserAccess_${userId}`, options);
            },
            /**
            * Operations on User Records (create, delete, etc)
            */
            accountUsers(accountId: string, options?: Audit.Options) {
                return scroll<'Network:User'>(`/network/audit/accounts/${accountId}/userAccess`, 'User', options);
            },
            user(userId: string, accountId: string, options?: Audit.Options) {
                return scroll<'Network:User'>(`/network/audit/accounts/${accountId}/userAccess/${userId}`, 'User', options);
            },
            /**
            * Operations on Group Records (create, delete, etc)
            */
            accountGroups(accountId: string, options?: Audit.Options) {
                return scroll<'Network:Group'>(`/network/audit/accounts/${accountId}/groups`, 'Groups', options);
            },
            group(groupId: string, accountId: string, options?: Audit.Options) {
                return scroll<'Network:Group'>(`/network/audit/accounts/${accountId}/groups/${groupId}`, 'Group', options);
            },
            /**
            * Operations on Device Records (create, delete, etc)
            */
            accountDevices(accountId: string, options?: Audit.Options) {
                return scroll<Audit.DeviceKeys>(`/network/audit/accounts/${accountId}/devices`, 'Devices', options);
            },
            device(deviceId: string, accountId: string, options?: Audit.Options) {
                return scroll<Audit.DeviceKeys>(`/network/audit/accounts/${accountId}/devices/${deviceId}`, 'Device', options);
            },
            /**
            * Operations on Video Records (create, delete, etc)
            */
            accountVideos(accountId: string, options?: Audit.Options) {
                return scroll<'Media:Video'>(`/network/audit/accounts/${accountId}/videos`, 'Videos', options);
            },
            video(videoId: string, accountId: string, options?: Audit.Options) {
                return scroll<'Media:Video'>(`/network/audit/accounts/${accountId}/videos/${videoId}`, 'Video', options);
            },
            /**
            * Operations on Webcast Records (create, delete, etc)
            */
            accountWebcasts(accountId: string, options?: Audit.Options) {
                return scroll<'ScheduledEvents:Webcast'>(`/network/audit/accounts/${accountId}/scheduledEvents`, 'Webcasts', options);
            },
            webcast(eventId: string, accountId: string, options?: Audit.Options) {
                return scroll<'ScheduledEvents:Webcast'>(`/network/audit/accounts/${accountId}/scheduledEvents/${eventId}`, `Webcast`, options);
            },
            /**
            * All operations a single user has made
            */
            principal(userId: string, accountId: string, options?: Audit.Options) {
                return scroll<string>(`/network/audit/accounts/${accountId}/principals/${userId}`, 'Principal', options);
            }
        },
        /**
        * Logs of user login / logout / failed login activity
        */
        async accountAccess(accountId: string, options?: Audit.Options) {
            return collect(auditAPI.stream.accountAccess(accountId, options));
        },
        async userAccess(userId: string, accountId: string, options?: Audit.Options) {
            return collect(auditAPI.stream.userAccess(userId, accountId, options));
        },
        /**
        * Operations on User Records (create, delete, etc)
        */
        async accountUsers(accountId: string, options?: Audit.Options) {
            return collect(auditAPI.stream.accountUsers(accountId, options));
        },
        async user(userId: string, accountId: string, options?: Audit.Options) {
            return collect(auditAPI.stream.user(userId, accountId, options));
        },
        /**
        * Operations on Group Records (create, delete, etc)
        */
        async accountGroups(accountId: string, options?: Audit.Options) {
            return collect(auditAPI.stream.accountGroups(accountId, options));
        },
        async group(groupId: string, accountId: string, options?: Audit.Options) {
            return collect(auditAPI.stream.group(groupId, accountId, options));
        },
        /**
        * Operations on Device Records (create, delete, etc)
        */
        async accountDevices(accountId: string, options?: Audit.Options) {
            return collect(auditAPI.stream.accountDevices(accountId, options));
        },
        async device(deviceId: string, accountId: string, options?: Audit.Options) {
            return collect(auditAPI.stream.device(deviceId, accountId, options));
        },
        /**
        * Operations on Video Records (create, delete, etc)
        */
        async accountVideos(accountId: string, options?: Audit.Options) {
            return collect(auditAPI.stream.accountVideos(accountId, options));
        },
        async video(videoId: string, accountId: string, options?: Audit.Options) {
            return collect(auditAPI.stream.video(videoId, accountId, options));
        },
        /**
        * Operations on Webcast Records (create, delete, etc)
        */
        async accountWebcasts(accountId: string, options?: Audit.Options) {
            return collect(auditAPI.stream.accountWebcasts(accountId, options));
        },
        async webcast(eventId: string, accountId: string, options?: Audit.Options) {
            return collect(auditAPI.stream.webcast(eventId, accountId, options));
        },
        /**
        * All operations a single user has made
        */
        async principal(userId: string, accountId: string, options?: Audit.Options) {
            return collect(auditAPI.stream.principal(userId, accountId, options));
        }
    };
    function asValidDate(val: string | Date, defaultValue: Date): Date {
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

    function parseEntry<EntityKey extends string>(line: Record<string, any>): Audit.Entry<EntityKey> {
        return {
            messageKey: line['MessageKey'],
            entityKey: line['EntityKey'],
            when: line['When'],
            principal: tryParseJson(line['Principal']) || {},
            message: tryParseJson(line['Message']) || {},
            currentState: tryParseJson(line['CurrentState']) || {},
            previousState: tryParseJson(line['PreviousState']) || {}
        };
    }
    async function* scroll<EntityKey extends string>(endpoint: string, label: string, options: Audit.Options = {}) {
        const {
            maxResults = Infinity,
            onPage = (current: number, total: number) => {
                rev.log('debug', `loading ${label}, ${current} of ${total}...`);
            },
            fromDate,
            toDate
        } = options;

        let _toDate = asValidDate(toDate, new Date());
        // default to one year older than toDate
        const defaultFrom = new Date(_toDate.setFullYear(_toDate.getFullYear() - 1));
        let _fromDate = asValidDate(fromDate, defaultFrom);

        if (_toDate < _fromDate) {
            [_toDate, _fromDate] = [_fromDate, _toDate];
        }

        const params: {
            toDate?: string,
            fromDate?: string,
            nextContinuationToken?: string;
        } = {
            toDate: _toDate.toISOString(),
            fromDate: _fromDate.toISOString()
        };

        let current: number = 0;
        let total: number;

        do {
            try {
                const response = await rev.request('GET', endpoint, { params });
                let lines = parseCSV(response.body);

                // limit results to specified max results
                if (current + lines.length >= maxResults) {
                    const delta = maxResults - current;
                    lines = lines.slice(0, delta);
                }

                current += lines.length;

                if (!total) {
                    total = Math.min(parseInt(response.headers.get('totalRecords'), 10), maxResults);
                }
                onPage(current, total || 0);

                if (lines.length === 0) {
                    return;
                }

                for (let entry of lines) {
                    yield parseEntry<EntityKey>(entry);
                }

                params.nextContinuationToken = response.headers.get('nextContinuationToken');
                params.fromDate = response.headers.get('nextfromDate');
            } catch (err) {
                rev.log('warn', err);
                throw err;
            }
        } while (params.nextContinuationToken && current < maxResults);
    }

    /**
    * takes an async stream of items and collects them into an array
    * @param stream
    */
    async function collect<T>(stream: AsyncGenerator<T>): Promise<T[]> {
        const records = [];
        for await (let record of stream) {
            records.push(record);
        }
        return records;
    }
    return auditAPI;
}
