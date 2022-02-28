import type { RevClient } from '../rev-client';

import type { Device } from '../types';

export default function deviceAPIFactory(rev: RevClient) {
    const deviceAPI = {
        async listDMEs(): Promise<Device.DmeDetails[]> {
            const response = await rev.get('/api/v2/devices/dmes');
            return response.devices;
        },
        async listZoneDevices(): Promise<Device.ZoneDevice[]> {
            const response = await rev.get('/api/v2/zonedevices');
            return response.devices;
        },
        async listPresentationProfiles(): Promise<Device.PresentationProfile[]> {
            return rev.get('/api/v2/presentation-profiles');
        },
        async add(dme: Device.CreateDMERequest) {
            return rev.post('/api/v2/devices/dmes', dme);
        },
        async healthStatus(deviceId: string): Promise<Device.DmeHealthStatus> {
            return rev.get(`/api/v2/devices/dmes/${deviceId}/health-status`);
        },
        async delete(deviceId: string) {
            return rev.delete(`/api/v2/devices/dmes/${deviceId}`);
        },
        async rebootDME(deviceId: string) {
            return rev.put(`/api/v2/devices/dmes/${deviceId}`);
        }
    };
    return deviceAPI;
}
