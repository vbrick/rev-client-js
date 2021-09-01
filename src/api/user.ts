import type { RevClient } from '../rev-client';
import type { Rev, User } from '../types';
import { searchScrollStream } from '../utils/request-utils';

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
        async search(searchText?: string, options: Rev.SearchOptions<User.SearchHit> = { }) {
            const searchDefinition = {
                endpoint: '/api/v2/search/access-entity',
                totalKey: 'totalEntities',
                hitsKey: 'accessEntities'
            };
            const query: Record<string, any> = { type: 'user' };
            if (searchText) {
                query.q = searchText;
            }
            const results: User.SearchHit[] = [];
            const pager = searchScrollStream<User.SearchHit>(rev, searchDefinition, query, options);
            for await (const user of pager) {
                results.push(user);
            }
            return results;
        }
    };
    return userAPI;
}
