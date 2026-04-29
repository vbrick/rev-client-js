import { SearchRequest } from "../utils/request-utils.js";
import type { Device } from "../types/device.js";
import type { RevClient } from "../rev-client.js";
import type { Rev } from "../types/rev.js";

type DeviceResponse = Pick<Device.LogItem, 'deviceId' | 'deviceName' | 'deviceType'> & {
    total: number;
    scrollId?: string;
    items: Omit<Device.LogItem, 'deviceId' | 'deviceName' | 'deviceType'>[]
}
function transformDeviceResponse(response: DeviceResponse) {
    const deviceInfo = {
        deviceId: response.deviceId,
        deviceName: response.deviceName,
        deviceType: response.deviceType
    };
    return {
        ...response,
        items: response.items.map(item => ({...deviceInfo, ...item}))
    };
}

export class DeviceLogsRequest extends SearchRequest<Device.LogItem> {
    constructor(rev: RevClient, query: Device.LogsRequest, options: Rev.SearchOptions<Device.LogItem> = {}) {
        const {accountId, deviceId, ...opts} = query;

        const endpoint = deviceId
            ? `/api/v2/devices/${deviceId}/logs`
            : accountId
            ? `/api/v2/devices/accounts/${accountId}/logs`
            : undefined;

        if (!endpoint) {
            throw new TypeError('Must specify accountId or deviceId');
        }

        const searchDefinition: Rev.SearchDefinition<Device.LogItem> = {
            endpoint,
            totalKey: 'total',
            hitsKey: 'items',
            request: async (endpoint, query, options) => {
                const response = await rev.get(endpoint, query, options);
                // standardize individual device vs. account responses to include same shape
                return deviceId
                    ? transformDeviceResponse(response)
                    : response;
            }
        };
        super(rev, searchDefinition, query, options);
    }
}
