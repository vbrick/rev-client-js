import type { RevClient } from '../rev-client';

import type { Device } from '../types/device.js';
import type { Rev } from '../types/rev.js';
import { DeviceLogsRequest } from './device-logs-request.js';

/** @ignore */
export type API = ReturnType<typeof deviceAPIFactory>;
/**
 * Device API methods
 * @category Devices
 * @group API
 * @see [Device API Docs](https://revdocs.vbrick.com/reference/getdmedevices-1)
 */
export interface DeviceAPI extends API {}

/** @ignore */
export default function deviceAPIFactory(rev: RevClient) {
    const deviceAPI = {
        /**
         * Get a list of all DMEs
         * @returns
         */
        async listDMEs(): Promise<Device.DmeDetails[]> {
            const response = await rev.get('/api/v2/devices/dmes');
            return response.devices;
        },
        /**
         * Get a list of devices that can be used for Zoning configuration
         * @returns
         */
        async listZoneDevices(): Promise<Device.ZoneDevice[]> {
            const response = await rev.get('/api/v2/zonedevices');
            return response.devices;
        },
        /**
         * Get a list of the Presentation Profiles defined in Rev
         * @returns
         */
        async listPresentationProfiles(): Promise<Device.PresentationProfile[]> {
            return rev.get('/api/v2/presentation-profiles');
        },
        /**
         * Create a new DME in Rev
         * @param dme
         * @returns
         */
        async add(dme: Device.CreateDMERequest) {
            return rev.post('/api/v2/devices/dmes', dme);
        },
        /**
         * Get details about the specified DME's health
         * @param deviceId
         * @returns
         */
        async healthStatus(deviceId: string): Promise<Device.DmeHealthStatus> {
            return rev.get(`/api/v2/devices/dmes/${deviceId}/health-status`);
        },
        /**
         * Remove a DME from Rev
         * @param deviceId
         * @returns
         */
        async delete(deviceId: string) {
            return rev.delete(`/api/v2/devices/dmes/${deviceId}`);
        },
        /**
         * Have Rev send a reboot request to the specified DME
         * @param deviceId
         * @returns
         */
        async rebootDME(deviceId: string) {
            return rev.put(`/api/v2/devices/dmes/${deviceId}`);
        },
        /**
         * This API allows account administrators to initiate and manage targeted video downloads to specific DMEs. Using a single API call, users can send one or more video instances (from the same videoID) to designated DMEs for prepositioning, regardless of the DME’s preposition settings.
         * @param deviceId id of device in question
         * @param request a list of videos and their instanceIds to include
         * @param options
         * @returns
         */
        async prepositionVideos(deviceId: string, request: Device.PrepositionVideosRequest | Device.PrepositionVideosRequest[], options?: Rev.RequestOptions): Promise<Device.PrepositionVideosResponse> {
            const payload = Array.isArray(request) ? request : [request];
            return rev.post(`/api/v2/devices/dmes/${deviceId}/prepositioned-videos`, payload, options);
        },
        /**
         * Get list of logs for a specific device or all devices in the account
         * pass {deviceId} to get for a single device
         * pass {accountId} to get for all devices in account
         *
         * @see [Device Logs](https://revdocs.vbrick.com/reference/getdevicelogs)
         * @see [Account Logs](https://revdocs.vbrick.com/reference/getaccountdevicelogs)
         */
        getLogs(request: Device.LogsRequest, options?: Rev.SearchOptions<Device.LogItem>) {
            return new DeviceLogsRequest(rev, request, options)
        }
    };
    return deviceAPI;
}
