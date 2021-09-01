import type { RevClient } from '../rev-client';
import type { Group, Rev, User } from '../types';
import { searchScrollStream } from '../utils/request-utils';

export default function groupAPIFactory(rev: RevClient) {
    const groupAPI = {
        /**
         * Create a group. Returns the resulting Group ID
         * @param {{name: string, userIds: string[], roleIds: string[]}} group
         * @returns {Promise<string>}
         */
        async create(group: Group.CreateRequest) {
            const { groupId } = await rev.post('/api/v2/groups', group);
            return groupId;
        },
        async delete(groupId: string) {
            await rev.delete(`/api/v2/groups/${groupId}`);
        },
        /**
         *
         * @param {string} [searchText]
         * @param {Rev.SearchOptions<{Id: string, Name: string}>} [options]
         */
        async search(searchText: string, options: Rev.SearchOptions<Group.SearchHit> = { }) {
            const searchDefinition = {
                endpoint: '/api/v2/search/access-entity',
                totalKey: 'totalEntities',
                hitsKey: 'accessEntities'
            };
            const query: Record<string, any> = { type: 'group' };
            if (searchText) {
                query.q = searchText;
            }
            const results: Group.SearchHit[] = [];
            const pager = searchScrollStream<Group.SearchHit>(rev, searchDefinition, query, options);
            for await (const rawGroup of pager) {
                results.push(rawGroup);
            }
            return results;
        },
        async list(options: Rev.SearchOptions<Group.SearchHit> = { }) {
            return groupAPI.search(undefined, options);
        },
        async listUsers(groupId: string, options: Rev.SearchOptions<string> = { }) {
            const searchDefinition = {
                endpoint: `/api/v2/search/groups/${groupId}/users`,
                totalKey: 'totalUsers',
                hitsKey: 'userIds'
            };
            const userIds: string[] = [];
            const pager = searchScrollStream<string>(rev, searchDefinition, undefined, options);
            for await (const id of pager) {
                userIds.push(id);
            }
            return userIds;
        },
        /**
         * get all users in a group with full details as a async generator
         * @param groupId
         * @param options
         * @returns
         */
        async * usersDetailStream(groupId: string, options: (Rev.SearchOptions<string> & { onError?: (userId: string, error: Error) => void; }) = { }): AsyncGenerator<User> {
            const {
                onError = (userId: string, error: Error) => rev.log('warn', `Error getting user details for ${userId}`, error),
                ...searchOptions
            } = options;
            const searchDefinition = {
                endpoint: `/api/v2/search/groups/${groupId}/users`,
                totalKey: 'totalUsers',
                hitsKey: 'userIds'
            };
            const pager = searchScrollStream<string>(rev, searchDefinition, undefined, searchOptions);
            for await (const userId of pager) {
                try {
                    const user = await rev.user.details(userId);
                    yield user;
                } catch (error) {
                    onError(userId, error);
                }
            }
        }
    };
    return groupAPI;
}
