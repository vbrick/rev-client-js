import type { RevClient } from '../rev-client';
import type { AccessControl, Channel, Rev } from '../types/index';
import { SearchRequest } from '../utils/request-utils';

/** @ignore */
export type API = ReturnType<typeof channelAPIFactory>;
/**
 * Channel API methods
 * @category Channels
 * @group API
 * @see [Channel API Docs](https://revdocs.vbrick.com/reference/getchannels)
 */
export interface ChannelAPI extends API {};

/** @ignore */
export default function channelAPIFactory(rev: RevClient) {
    const channelAPI = {
        async create(channel: Channel.CreateRequest): Promise<string> {
            const {channelId} = await rev.post('/api/v2/channels', channel, { responseType: 'json' });
            return channelId;
        },
        async update(channelId: string, channel: Channel.CreateRequest): Promise<void> {
            return rev.put(`/api/v2/channels/${channelId}`, channel);
        },
        /**
         * @summary Patch Channel
         * Partially edits the members and details of a channel. You do not need to provide the fields that you are not changing.
         * @example
         * ```js
         * const rev = new RevClient(...config...);
         * await rev.connect();
         *
         * // add a member
         * await rev.channel.patch(channelId, [{ op: 'add', path: '/Members/-', value: { id: userId, type: 'User', roleTypes: 'Uploader' } }]);
         *
         * // add current user as an admin
         * const user = await rev.user.details('me');
         * await rev.channel.patch(channelId, [{ op: 'add', path: '/Members/-', value: { id: user.userId, type: 'User', roleTypes: 'Admin' } }]);
         *
         * // change sort order
         * await rev.channel.patch(channelId, [{ op: 'replace', path: '/DefaultSortOrder', value: 'recommended' }]);
         *
         * ```
         * @param channelId
         * @param operations
         * @param options
         */
        async patch(channelId: string, operations: Rev.PatchOperation[], options?: Rev.RequestOptions): Promise<void> {
            await rev.patch(`/api/v2/channels/${channelId}`, operations, options);
        },
        async delete(channelId: string): Promise<void> {
            return rev.delete(`/api/v2/channels/${channelId}`);
        },
        /**
         * get list of channels in system
         * @see {@link https://revdocs.vbrick.com/reference/getchannels}
         */
        list(start: number = 0, options: Channel.SearchOptions = {}): ChannelListRequest {
            return new ChannelListRequest(rev, start, options);
        },
        async addMembers(channelId: string, members: Channel.Member[]) {
            const operations = members
                .map(member => {
                    return { op: 'add', path: '/Members/-', value: member };
                });
            await rev.patch(`/api/v2/channels/${channelId}`, operations);
        },
        async removeMembers(channelId: string, members: Array<string | Channel.Member>) {
            const operations = members
                .map(member => {
                    const entityId = typeof member === 'string'
                        ? member
                        : member.id;

                    return { op: 'remove', path: '/Members', value: entityId };
                });

            await rev.patch(`/api/v2/channels/${channelId}`, operations);
        },
        get uploadLogo() {
            return rev.upload.channelLogo;
        },
        get uploadHeader() {
            return rev.upload.channelHeader;
        },
        async downloadLogo<T = ReadableStream>(channel: {logoKey?: string | null, logoUri?: string | null}, options: Rev.RequestOptions): Promise<Rev.Response<T>> {
            const endpoint = channel?.logoKey
                ? `/api/v2/channels/thumbnails/${channel?.logoKey}`
                : channel?.logoUri;

            if (!endpoint) throw new TypeError('Channel has no logo');
            const response = await rev.request<T>('GET', endpoint, undefined, {
                responseType: 'stream',
                ...options
            });
            return response;
        },
        async downloadHeader<T = ReadableStream>(channel: {headerKey?: string | null, headerUri?: string | null}, options: Rev.RequestOptions): Promise<Rev.Response<T>> {
            const endpoint = channel?.headerKey
                ? `/api/v2/channels/thumbnails/${channel?.headerKey}`
                : channel?.headerUri;
            if (!endpoint) throw new TypeError('Channel has no header');
            const response = await rev.request<T>('GET', endpoint, undefined, {
                responseType: 'stream',
                ...options
            });
            return response;
        },
        /**
         *
         * @param {string} [searchText]
         * @param {Rev.SearchOptions<{Id: string, Name: string}>} [options]
         */
        search(searchText?: string, options: Rev.AccessEntitySearchOptions<AccessControl.SearchHit> & { type?: AccessControl.EntitySearchType } = { }) {
            const searchDefinition = {
                endpoint: `/api/v2/search/access-entity${options?.assignable ? '/assignable' : ''}`,
                totalKey: 'totalEntities',
                hitsKey: 'accessEntities'
            };
            const query: Record<string, any> = {
                type: options.type || 'Channel',
                ...searchText && {q: searchText}
            };
            return new SearchRequest<AccessControl.SearchHit>(rev, searchDefinition, query, options);
        },
        /**
         * @summary Get Channels For User
         * Returns only the channels and video count for the user making the API call based on their access control.
         * @param options
         */
        async listUserChannels(options?: Rev.RequestOptions): Promise<Channel.UserListItem[]> {
            return rev.get('/api/v2/search/channels', undefined, options);
        }
    };
    return channelAPI;
}

/** @category Channels */
export class ChannelListRequest implements Rev.ISearchRequest<Channel.SearchHit> {
    currentPage: number;
    current: number;
    total: number;
    done: boolean;
    options: Required<Pick<Channel.SearchOptions, 'maxResults' | 'onProgress' | 'pageSize'>>;
    private _req: () => Promise<Channel.SearchHit[]>;
    constructor(rev: RevClient, start: number = 0, options: Channel.SearchOptions = {}) {
        this.options = {
            maxResults: Infinity,
            pageSize: 10,
            onProgress: (items: Channel.SearchHit[], current: number, total: number) => {
                rev.log('debug', `loading channels, ${current} of ${total}...`);
            },
            ...options
        };

        this.current = 0;
        this.total = Infinity;
        this.done = false;
        this.currentPage = start;

        this._req = () => {
            const params = {
                page: this.currentPage,
                size: this.options.pageSize
            };
            return rev.get('/api/v2/channels', params, { responseType: 'json' });
        }

    }
    async nextPage() {
        const {
            maxResults,
            onProgress
        } = this.options;

        let current = this.current;

        let items: Channel.SearchHit[] = await this._req();

        if (!Array.isArray(items) || items.length == 0) {
            this.done = true;
            items = [];
        }

        if (current + items.length >= maxResults) {
            const delta = maxResults - current;
            items = items.slice(0, delta);
            this.done = true;
        }
        this.total = current + items.length;

        onProgress(items, current, this.total);

        this.current += items.length;
        this.currentPage += 1;

        return {
            current,
            total: this.total,
            done: this.done,
            items
        };
    }
    /**
     * Go through all pages of results and return as an array.
     * TIP: Use the {maxResults} option to limit the maximum number of results
     *
     */
    async exec(): Promise<Channel.SearchHit[]> {
        const results: Channel.SearchHit[] = [];
        // use async iterator
        for await (let hit of this) {
            results.push(hit);
        }
        return results;
    }
    async* [Symbol.asyncIterator]() {
        do {
            const {
                items
            } = await this.nextPage();

            for await (let hit of items) {
                yield hit;
            }
        } while (!this.done);
    }
}
