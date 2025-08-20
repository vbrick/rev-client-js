import type { RevClient } from '../rev-client';
import type { Group, Rev, User } from '../types/index';
import { SearchRequest } from '../utils/request-utils';

/** @ignore */
export type API = ReturnType<typeof groupAPIFactory>;

/**
 * Group API methods
 * @category Users & Groups
 * @group API
 * @see [Group API Docs](https://revdocs.vbrick.com/reference/getgroups-1)
 */
export interface GroupAPI extends API {}

/** @ignore */
export default function groupAPIFactory(rev: RevClient) {
    const groupAPI = {
        /**
         * Create a group. Returns the resulting Group ID
         * @param {{name: string, userIds: string[], roleIds: string[]}} group
         * @returns {Promise<string>}
         */
        async create(group: Group.CreateRequest): Promise<string> {
            const { groupId } = await rev.post('/api/v2/groups', group);
            return groupId;
        },
        async delete(groupId: string) {
            await rev.delete(`/api/v2/groups/${groupId}`);
        },
        async details(groupId: string): Promise<Group.Details> {
            return rev.get(`/api/v2/groups/${groupId}`);
        },
        /**
         *
         * @param {string} [searchText]
         * @param {Rev.SearchOptions<{Id: string, Name: string}>} [options]
         */
        search(searchText?: string, options: Rev.AccessEntitySearchOptions<Group.SearchHit> = { }) {
            const searchDefinition = {
                endpoint: `/api/v2/search/access-entity${options?.assignable ? '/assignable' : ''}`,
                totalKey: 'totalEntities',
                hitsKey: 'accessEntities',
                transform: (hits: Group.RawSearchHit[]) => hits.map(formatGroupSearchHit)
            };
            const query: Record<string, any> = { type: 'group' };
            if (searchText) {
                query.q = searchText;
            }
            return new SearchRequest<Group.SearchHit>(rev, searchDefinition, query, options);
        },
        list(options: Rev.SearchOptions<Group.SearchHit> = { }) {
            return groupAPI.search(undefined, options);
        },
        listUsers(groupId: string, options: Rev.SearchOptions<string> = { }) {
            const searchDefinition = {
                endpoint: `/api/v2/search/groups/${groupId}/users`,
                totalKey: 'totalUsers',
                hitsKey: 'userIds'
            };
            return new SearchRequest<string>(rev, searchDefinition, undefined, options);
        },
        /**
         * get all users in a group with full details
         * @param groupId
         * @param options
         * @returns
         */
        listUserDetails(groupId: string, options: Rev.SearchOptions<User & { error?: Error }> = { }) {
            const searchDefinition = {
                endpoint: `/api/v2/search/groups/${groupId}/users`,
                totalKey: 'totalUsers',
                hitsKey: 'userIds',
                transform: async (userIds: string[]) => {
                    const result: User[] = [];
                    for (let userId of userIds) {
                        const out: User & {error: Error} = { userId } as any;
                        try {
                            const details = await rev.user.details(userId);
                            Object.assign(out, details);
                        } catch (error: any) {
                            out.error = error;
                        }
                        result.push(out);
                    }
                    return result;
                }
            };
            return new SearchRequest<User & {userId: string, error?: Error}>(rev, searchDefinition, undefined, options);
        }
    };
    return groupAPI;
}

function formatGroupSearchHit(hit: Group.RawSearchHit): Group.SearchHit {
    return {
        id: hit.Id,
        name: hit.Name,
        entityType: hit.EntityType
    };
}
