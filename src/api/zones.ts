import type { RevClient } from '../rev-client';
import { Zone } from '../types/zone';

export default function zonesAPIFactory(rev: RevClient) {
    const zonesAPI = {
        async list(): Promise<{ defaultZone: Zone, zones: Zone[]; }> {
            return rev.get(`/api/v2/zones`, undefined, { responseType: 'json' });
        },
        async flatList(): Promise<Zone.FlatZone[]> {
            const {
                defaultZone,
                zones
            } = await zonesAPI.list();
            const flatZones: Omit<Zone, 'childZones'>[] = [defaultZone];
            function recursiveAdd(inZone: Zone) {
                const {
                    childZones = [],
                    ...zone
                } = inZone;

                flatZones.push(zone);
                childZones.forEach(recursiveAdd);
            }
            zones.forEach(recursiveAdd);
            return flatZones;
        },
        async create(zone: Zone.CreateRequest): Promise<string> {
            const { zoneId } = await rev.post(`/api/v2/zones`, zone, { responseType: 'json' });
            return zoneId;
        },
        async edit(zoneId: string, zone: Zone.CreateRequest): Promise<void> {
            return rev.put(`/api/v2/zones/${zoneId}`, zone);
        },
        delete(zoneId: string) {
            return rev.delete(`/api/v2/zones/${zoneId}`);
        },
        get devices() {
            return rev.device.listZoneDevices;
        }
    };
    return zonesAPI;
}
