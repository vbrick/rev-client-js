import type { RevClient } from '../rev-client';
import type { Audit } from '../types';
import { AuditRequest } from './audit-request';

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
            return new AuditRequest<Audit.UserEntry>(rev, `/network/audit/accounts/${accountId}/users`, 'User', options);
        },
        user(userId: string, accountId: string, options?: Audit.Options<Audit.UserEntry>) {
            return new AuditRequest<Audit.UserEntry>(rev, `/network/audit/accounts/${accountId}/users/${userId}`, 'User', options);
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
