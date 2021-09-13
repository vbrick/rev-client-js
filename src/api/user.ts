import type { RevClient } from '../rev-client';
import type { Rev, User } from '../types';
import { SearchRequest } from '../utils/request-utils';

export default function userAPIFactory(rev: RevClient) {
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
        async details(userId: string) {
            return rev.get<User>(`/api/v2/users/${userId}`);
        },
        /**
         */
        async getByUsername(username: string) {
            return rev.get<User>(`/api/v2/users/${username}`, { type: 'username' });
        },
        /**
         */
        async getByEmail(email: string) {
            return rev.get<User>(`/api/v2/users/${email}`, { type: 'email' });
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
        /**
         * search for users based on text query. Leave blank to return all users.
         *
         * @param {string} [searchText]
         * @param {Rev.SearchOptions<{Id: string, Name: string}>} [options]
         */
        search(searchText?: string, options: Rev.SearchOptions<User.SearchHit> = { }): SearchRequest<User.SearchHit> {
            const searchDefinition = {
                endpoint: '/api/v2/search/access-entity',
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
        username: hit.UserName
    };
}
