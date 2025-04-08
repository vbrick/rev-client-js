import type { Admin, Rev, Role, RegistrationField } from '../types/index';
import type { RevClient } from '../rev-client';
import { SearchRequest } from '../utils/request-utils';

/**
 * if true allow storing/retrieving from cached values. 'Force' means refresh value saved in cache. false means bypass cache
 * @inline
 * @ignore
 */
type CacheOption = boolean | 'Force'

/** @ignore */
export type API = ReturnType<typeof adminAPIFactory>;
/**
 * The Admin API methods
 * @category Administration
 * @group API
 * @see [Administration API Docs](https://revdocs.vbrick.com/reference/getroles)
 */
export interface AdminAPI extends API {}

/** @ignore */
export default function adminAPIFactory(rev: RevClient) {
    let roles: Role.Details[];
    let customFields: Admin.CustomField[];

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
        * @param name Name of the Role OR RoleType. You can specify the specific enum value (preferred, only Rev 7.53+), or the localized string value in the current user's language, i.e. "Media Viewer" for english
        * @param fromCache - if true then use previously cached Role listing (more efficient)
        */
        async getRoleByName(name: Role.RoleType | Role.RoleName, fromCache: CacheOption = true): Promise<Role> {
            const roles = await adminAPI.roles(fromCache);
            const role = roles.find(r => r.roleType === name || r.name === name);
            if (!role) {
                throw new TypeError(`Invalid Role Name ${name}. Valid values are: ${roles.flatMap(r => r.roleType ? [r.roleType, r.name] : [r.name]).join(', ')}`);
            }
            return {
                id: role.id,
                name: role.roleType || role.name
            };
        },
        /**
        * get list of custom fields
        * @param cache - if true allow storing/retrieving from cached values. 'Force' means refresh value saved in cache
        */
        async customFields(cache: CacheOption = true): Promise<Admin.CustomField[]> {
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
        async getCustomFieldByName(name: string, fromCache: CacheOption = true): Promise<Admin.CustomField> {
            const customFields = await adminAPI.customFields(fromCache);
            const field = customFields.find(cf => cf.name === name);
            if (!field) {
                throw new TypeError(`Invalid Custom Field Name ${name}. Valid values are: ${customFields.map(cf => cf.name).join(', ')}`);
            }
            return field;
        },
        async brandingSettings(): Promise<Admin.BrandingSettings> {
            return rev.get('/api/v2/accounts/branding-settings');
        },
        async webcastRegistrationFields(): Promise<RegistrationField & { id: string }> {
            const response = await rev.get('/api/v2/accounts/webcast-registration-fields');
            return response.registrationFields;
        },
        async createWebcastRegistrationField(registrationField: RegistrationField.Request): Promise<string> {
            const response = await rev.post('/api/v2/accounts/webcast-registration-fields', registrationField);
            return response.fieldId;
        },
        async updateWebcastRegistrationField(fieldId: string, registrationField: Partial<RegistrationField.Request>): Promise<void> {
            return rev.put(`/api/v2/accounts/webcast-registration-fields/${fieldId}`, registrationField);
        },
        async deleteWebcastRegistrationField(fieldId: string): Promise<void> {
            return rev.delete(`/api/v2/accounts/webcast-registration-fields/${fieldId}`);
        },
        listIQCreditsUsage(query: { startDate?: string | Date, endDate?: string | Date }, options?: Rev.SearchOptions<Admin.IQCreditsSession>): Rev.ISearchRequest<Admin.IQCreditsSession> {
            const searchDefinition: Rev.SearchDefinition<Admin.IQCreditsSession> = {
                endpoint: `/api/v2/analytics/accounts/iq-credits-usage`,
                totalKey: 'total',
                hitsKey: 'sessions'
            };
            return new SearchRequest<Admin.IQCreditsSession>(rev, searchDefinition, query, options);
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
        },
        /**
         * gets the user location service URL
         */
        async userLocationService(): Promise<{ enabled: boolean, locationUrls: string[] }> {
            return rev.get('/api/v2/user-location');
        },
        /**
         * returns an array of all expiration rules
         */
        async expirationRules(): Promise<Admin.ExpirationRule[]> {
            return rev.get('/api/v2/expiration-rules');
        },
        async featureSettings(videoId?: string): Promise<Admin.FeatureSettings> {
            const params = videoId ? { videoId } : undefined;
            return rev.get('/api/v2/videos/feature-settings', params);
        }
    };
    return adminAPI;
}
