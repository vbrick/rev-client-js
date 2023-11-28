import { Rev } from '.';
import { PagedRequest } from '../utils/paged-request';

export namespace Audit {

    export interface Options<T extends Entry> extends Rev.SearchOptions<T> {
        fromDate?: string | Date,
        toDate?: string | Date;
        beforeRequest?: (request: PagedRequest<T>) => Promise<void>;
    }

    export interface Entry<EntityKey extends string = string> {
        messageKey: string;
        entityKey: EntityKey;
        when: string;
        principal: Record<string, string | null>,
        message: Record<string, any>,
        currentState: Record<string, any>,
        previousState: Record<string, any>;
    }
    export type UserAccessEntry = Entry<'Network.UserAccess'>;
    export type UserEntry = Entry<'Network.User'>;
    export type GroupEntry = Entry<'Network.Group'>;
    type DeviceKeys = 'Devices:DmeDevice' | 'Devices:EncoderDevice' | 'Devices:CustomDevice' | 'Devices:LdapConnectorDevice' | 'Devices:AkamaiDevice';
    export type DeviceEntry = Entry<DeviceKeys>;
    export type VideoEntry = Entry<'Media:Video'>;
    export type WebcastEntry = Entry<'ScheduledEvents:Webcast'>;
}
