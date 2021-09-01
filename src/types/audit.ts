
export namespace Audit {
    export type DeviceKeys = 'Devices:DmeDevice' | 'Devices:EncoderDevice' | 'Devices:CustomDevice' | 'Devices:LdapConnectorDevice' | 'Devices:AkamaiDevice';
    export interface Options {
        maxResults?: number,
        onPage?: (current: number, total: number) => void,
        fromDate?: string | Date,
        toDate?: string | Date;
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
}
