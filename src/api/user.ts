import type { RevClient } from '../rev-client';
import type { Rev, User } from '../types';
import { LiteralString } from '../types/rev';
import { RateLimitEnum, isPlainObject } from '../utils';
import { SearchRequest } from '../utils/request-utils';

export default function userAPIFactory(rev: RevClient) {
    /**
     * Get details about a specific user
     * @param userLookupValue default is search by userId
     * @param type            specify that userLookupValue is email or
     *                        username instead of userId
     * @returns {User}        User details
     */
    function details(userId: string, options?: User.DetailsOptions): Promise<User>;
    /** @deprecated - use {lookupType: 'username'} */
    function details(username: string, type: 'username'): Promise<User>;
    /** @deprecated - use {lookupType: 'email'} */
    function details(email: string, type: 'email'): Promise<User>;
    async function details(userLookupValue: string, options: User.DetailsLookup | User.DetailsOptions = {}) {
        const {lookupType, ...requestOptions} = typeof options === 'string'
            ? {lookupType: options}
            : options;

        const query = (lookupType === 'username' || lookupType === 'email')
            ? { type: lookupType }
            : undefined;

        return rev.get<User>(`/api/v2/users/${userLookupValue}`, query, {...requestOptions, responseType: 'json'});
    }

    const userAPI = {
        /**
         * get the list of roles available in the system (with role name and id)
         */
        get roles() {
            return rev.admin.roles;
        },
        /**
         * Create a new User in Rev
         * @param user
         * @returns the User ID of the created user
         */
        async create(user: User.Request): Promise<string> {
            const { userId } = await rev.post('/api/v2/users', user);
            return userId;
        },
        async delete(userId: string): Promise<void> {
            await rev.delete(`/api/v2/users/${userId}`);
        },
        details,
        /**
         * Use the Details API to get information about currently logged in user
         * @param requestOptions
         */
        async profile(requestOptions?: Rev.RequestOptions) {
            return details('me', requestOptions);
        },
        /**
         * get user details by username
         * @deprecated - use details(username, {lookupType: 'username'})
         */
        async getByUsername(username: string) {
            // equivalent to rev.get<User>(`/api/v2/users/${username}`, { type: 'username' });
            return userAPI.details(username, {lookupType: 'username'});
        },
        /**
         * get user details by email address
         * @deprecated - use details(email, 'email')
         */
        async getByEmail(email: string) {
            return userAPI.details(email, {lookupType: 'email'});
        },
        /**
         * Check if user exists in the system. Instead of throwing on a 401/403 error if
         * user does not exist it returns false. Returns user details if does exist,
         * instead of just true
         * @param userLookupValue userId, username, or email
         * @param type
         * @returns User if exists, otherwise false
         */
        async exists(userLookupValue: string, type?: User.DetailsLookup): Promise<User | false> {
            const query = (type === 'username' || type === 'email')
            ? { type }
            : undefined;

            const response = await rev.request<User>('GET', `/api/v2/users/${userLookupValue}`, query, { responseType: 'json', throwHttpErrors: false });

            return response.statusCode === 200
                ? response.body
                : false;
        },
        /**
         * use PATCH API to add user to the specified group
         * https://revdocs.vbrick.com/reference#edituserdetails
         * @param {string} userId id of user in question
         * @param {string} groupId
         * @returns {Promise<void>}
         */
        async addToGroup(userId: string, groupId: string) {
            const operations = [
                { op: 'add', path: '/GroupIds/-', value: groupId }
            ];
            await rev.patch(`/api/v2/users/${userId}`, operations);
        },
        /**
         * use PATCH API to add user to the specified group
         * https://revdocs.vbrick.com/reference#edituserdetails
         * @param {string} userId id of user in question
         * @param {string} groupId
         * @returns {Promise<void>}
         */
        async removeFromGroup(userId: string, groupId: string) {
            const operations = [
                { op: 'remove', path: '/GroupIds', value: groupId }
            ];
            await rev.patch(`/api/v2/users/${userId}`, operations);
        },
        async suspend(userId: string) {
            const operations = [{ op: 'replace', path: '/ItemStatus', value: 'Suspended' }];
            await rev.patch(`/api/v2/users/${userId}`, operations);
        },
        async unsuspend(userId: string) {
            const operations = [{ op: 'replace', path: '/ItemStatus', value: 'Active' }];
            await rev.patch(`/api/v2/users/${userId}`, operations);
        },
        /**
         * search for users based on text query. Leave blank to return all users.
         *
         * @param {string} [searchText]
         * @param {Rev.SearchOptions<{Id: string, Name: string}>} [options]
         */
        search(searchText?: string, options: Rev.AccessEntitySearchOptions<User.SearchHit> = { }): Rev.ISearchRequest<User.SearchHit> {
            const {
                assignable = false
            } = options;
            const searchDefinition = {
                endpoint: `/api/v2/search/access-entity${assignable ? '/assignable' : ''}`,
                totalKey: 'totalEntities',
                hitsKey: 'accessEntities',
                /**
                 * the result of this search is uppercase keys. This transforms them to camelcase to match other API responses
                 */
                transform: (items: User.RawSearchHit[]) => items.map(formatUserSearchHit)
            };
            const query: Record<string, any> = { type: 'user' };
            if (searchText) {
                query.q = searchText;
            }
            return new SearchRequest(rev, searchDefinition, query, options);
        },
        /**
         * Returns the channel and category subscriptions for the user making the API call.
         */
        async listSubscriptions(): Promise<{ categories: string[], channels: string[] }> {
            return rev.get('/api/v2/users/subscriptions');
        },
        async subscribe(id: string, type: LiteralString<'Channel' | 'Category'>): Promise<void> {
            return rev.post('/api/v2/users/subscribe', { id, type });
        },
        /**
         * Unsubscribe from specific channel or category.
         */
        async unsubscribe(id: string, type: LiteralString<'Channel' | 'Category'>): Promise<void> {
            return rev.post('/api/v2/users/unsubscribe', { id, type });
        },
        async getNotifications(unread: boolean = false): Promise<{ count: number, notifications: User.Notification[]}> {
            return rev.get('/api/v2/users/notifications', { unread });
        },
        /**
         *
         * @param notificationId If notificationId not provided, then all notifications for the user are marked as read.
         */
        async markNotificationRead(notificationId?: string): Promise<void> {
            await rev.put('/api/v2/users/notifications', notificationId ? {notificationId} : undefined);
        },
        async loginReport(sortField?: User.LoginReportSort, sortOrder?: Rev.SortDirection): Promise<User.LoginReportEntry[]> {
            const query = {
                ...sortField && { sortField },
                ...sortOrder && { sortOrder }
            };
            await rev.session.queueRequest(RateLimitEnum.GetUsersByLoginDate);
            const {Users} = await rev.get('/api/v2/users/login-report', query, { responseType: 'json' });
            return Users;
        }
    };
    return userAPI;
}

function formatUserSearchHit(hit: User.RawSearchHit): User.SearchHit {
    return {
        userId: hit.Id,
        entityType: hit.EntityType,
        email: hit.Email,
        firstname: hit.FirstName,
        lastname: hit.LastName,
        username: hit.UserName,
        profileImageUri: hit.ProfileImageUri
    };
}
