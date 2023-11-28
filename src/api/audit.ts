import type { RevClient } from '../rev-client';
import type { Audit, Rev } from '../types';
import { RateLimitEnum, makeQueue, normalizeRateLimitOptions } from '../utils/rate-limit-queues';
import { AuditRequest } from './audit-request';

export default function auditAPIFactory(rev: RevClient, optRateLimits?: Rev.Options['rateLimits']) {
    // The Audit API endpoints each have their own bucket of limits, so we keep track of each one here

    // parse the incoming rate limit option and pass into AuditRequest object
    const requestsPerMinute = normalizeRateLimitOptions(optRateLimits)[RateLimitEnum.AuditEndpoints];
    function makeOptTransform() {
        if (!requestsPerMinute) return (opts?: Audit.Options<any>) => opts;
        const lock = makeQueue(RateLimitEnum.AuditEndpoints, requestsPerMinute);
        return (opts: Audit.Options<any> = {}) => ({
            ...opts,
            async beforeRequest(req: AuditRequest<any>) {
                await lock();
                return opts.beforeRequest?.(req);
            }
        } as Audit.Options<any>);
    }
    const locks = {
        accountAccess: makeOptTransform(),
        userAccess: makeOptTransform(),
        accountUsers: makeOptTransform(),
        user: makeOptTransform(),
        accountGroups: makeOptTransform(),
        group: makeOptTransform(),
        accountDevices: makeOptTransform(),
        device: makeOptTransform(),
        accountVideos: makeOptTransform(),
        video: makeOptTransform(),
        accountWebcasts: makeOptTransform(),
        webcast: makeOptTransform(),
        principal: makeOptTransform()
    };


    const auditAPI = {
        /**
        * Logs of user login / logout / failed login activity
        */
        accountAccess(accountId: string, options?: Audit.Options<Audit.UserAccessEntry>) {
            const opts = locks.accountAccess(options);
            return new AuditRequest<Audit.UserAccessEntry>(rev, `/network/audit/accounts/${accountId}/userAccess`, 'UserAccess', opts);
        },
        userAccess(userId: string, accountId: string, options?: Audit.Options<Audit.UserAccessEntry>) {
            const opts = locks.userAccess(options);
            return new AuditRequest<Audit.UserAccessEntry>(rev, `/network/audit/accounts/${accountId}/userAccess/${userId}`, `UserAccess_${userId}`, opts);
        },
        /**
        * Operations on User Records (create, delete, etc)
        */
        accountUsers(accountId: string, options?: Audit.Options<Audit.UserEntry>) {
            const opts = locks.accountUsers(options);
            return new AuditRequest<Audit.UserEntry>(rev, `/network/audit/accounts/${accountId}/users`, 'User', opts);
        },
        user(userId: string, accountId: string, options?: Audit.Options<Audit.UserEntry>) {
            const opts = locks.user(options);
            return new AuditRequest<Audit.UserEntry>(rev, `/network/audit/accounts/${accountId}/users/${userId}`, 'User', opts);
        },
        /**
        * Operations on Group Records (create, delete, etc)
        */
        accountGroups(accountId: string, options?: Audit.Options<Audit.GroupEntry>) {
            const opts = locks.accountGroups(options);
            return new AuditRequest<Audit.GroupEntry>(rev, `/network/audit/accounts/${accountId}/groups`, 'Groups', opts);
        },
        group(groupId: string, accountId: string, options?: Audit.Options<Audit.GroupEntry>) {
            const opts = locks.group(options);
            return new AuditRequest<Audit.GroupEntry>(rev, `/network/audit/accounts/${accountId}/groups/${groupId}`, 'Group', opts);
        },
        /**
        * Operations on Device Records (create, delete, etc)
        */
        accountDevices(accountId: string, options?: Audit.Options<Audit.DeviceEntry>) {
            const opts = locks.accountDevices(options);
            return new AuditRequest<Audit.DeviceEntry>(rev, `/network/audit/accounts/${accountId}/devices`, 'Devices', opts);
        },
        device(deviceId: string, accountId: string, options?: Audit.Options<Audit.DeviceEntry>) {
            const opts = locks.device(options);
            return new AuditRequest<Audit.DeviceEntry>(rev, `/network/audit/accounts/${accountId}/devices/${deviceId}`, 'Device', opts);
        },
        /**
        * Operations on Video Records (create, delete, etc)
        */
        accountVideos(accountId: string, options?: Audit.Options<Audit.VideoEntry>) {
            const opts = locks.accountVideos(options);
            return new AuditRequest<Audit.VideoEntry>(rev, `/network/audit/accounts/${accountId}/videos`, 'Videos', opts);
        },
        video(videoId: string, accountId: string, options?: Audit.Options<Audit.VideoEntry>) {
            const opts = locks.video(options);
            return new AuditRequest<Audit.VideoEntry>(rev, `/network/audit/accounts/${accountId}/videos/${videoId}`, 'Video', opts);
        },
        /**
        * Operations on Webcast Records (create, delete, etc)
        */
        accountWebcasts(accountId: string, options?: Audit.Options<Audit.WebcastEntry>) {
            const opts = locks.accountWebcasts(options);
            return new AuditRequest<Audit.WebcastEntry>(rev, `/network/audit/accounts/${accountId}/scheduledEvents`, 'Webcasts', opts);
        },
        webcast(eventId: string, accountId: string, options?: Audit.Options<Audit.WebcastEntry>) {
            const opts = locks.webcast(options);
            return new AuditRequest<Audit.WebcastEntry>(rev, `/network/audit/accounts/${accountId}/scheduledEvents/${eventId}`, `Webcast`, opts);
        },
        /**
        * All operations a single user has made
        */
        principal(userId: string, accountId: string, options?: Audit.Options<Audit.Entry<string>>) {
            const opts = locks.principal(options);
            return new AuditRequest<Audit.Entry<string>>(rev, `/network/audit/accounts/${accountId}/principals/${userId}`, 'Principal', opts);
        }
    };

    return auditAPI;
}
