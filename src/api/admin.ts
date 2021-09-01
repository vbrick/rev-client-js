import { BrandingSettings, CustomField, RevError, Role } from '..';
import type { RevClient } from '../rev-client';

// if true allow storing/retrieving from cached values. 'Force' means refresh value saved in cache. false means bypass cache
type CacheOption = boolean | 'Force'

export default function adminAPIFactory(rev: RevClient) {
    let roles: Role.Details[];
    let customFields: CustomField[];

    const adminAPI = {
        /**
        * get mapping of role names to role IDs
        * @param cache - if true allow storing/retrieving from cached values. 'Force' means refresh value saved in cache
        */
        async roles(cache: CacheOption = true): Promise<Role.Details[]> {
            // retrieve from cached values if already stored. otherwise get from API
            // if cache is 'Force' then refresh from
            if (roles && cache === true) {
                return roles;
            }
            const response = await rev.get('/api/v2/users/roles');
            if (cache) {
                roles = response;
            }
            return response;
        },
        /**
        * Get a Role (with the role id) based on its name
        * @param name Name of the Role, i.e. "Media Viewer"
        * @param fromCache - if true then use previously cached Role listing (more efficient)
        */
        async getRoleByName(name: Role.RoleName, fromCache: CacheOption = true): Promise<Role> {
            const roles = await adminAPI.roles(fromCache);
            const role = roles.find(r => r.name === name);
            return {
                id: role.id,
                name: role.name
            };
        },
        /**
        * get list of custom fields
        * @param cache - if true allow storing/retrieving from cached values. 'Force' means refresh value saved in cache
        */
        async customFields(cache: CacheOption = true): Promise<CustomField[]> {
            // retrieve from cached values if already stored. otherwise get from API
            // if cache is 'Force' then refresh from
            if (customFields && cache === true) {
                return customFields;
            }
            const response = await rev.get('/api/v2/video-fields', undefined, { responseType: 'json' });
            if (cache) {
                customFields = response;
            }
            return response;
        },
        /**
        * Get a Custom Field based on its name
        * @param name name of the Custom Field
        * @param fromCache if true then use previously cached Role listing (more efficient)
        */
        async getCustomFieldByName(name: string, fromCache: CacheOption = true): Promise<CustomField> {
            const customFields = await adminAPI.customFields(fromCache);
            return customFields.find(cf => cf.name === name);
        },
        async brandingSettings(): Promise<BrandingSettings> {
            return rev.get('/api/v2/accounts/branding-settings');
        },
        /**
        * get system health - returns 200 if system is active and responding, otherwise throws error
        */
        async verifySystemHealth(): Promise<boolean> {
            await rev.get('/api/v2/system-health');
            return true;
        },
        /**
        * gets list of scheduled maintenance windows
        */
        async maintenanceSchedule(): Promise<{start: string, end: string}[]> {
            const {schedules} = await rev.get('/api/v2/maintenance-schedule');
            return schedules;
        }
    };
    return adminAPI;
}
