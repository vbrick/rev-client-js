import type { RevClient } from '../rev-client';
import type { AccessControl, Channel, Rev } from '../types';
import { SearchRequest } from '../utils/request-utils';

export default function channelAPIFactory(rev: RevClient) {
    const channelAPI = {
        async create(channel: Channel.CreateRequest): Promise<string> {
            const {channelId} = await rev.post('/api/v2/channels', channel, { responseType: 'json' });
            return channelId;
        },
        async update(channelId: string, channel: Channel.CreateRequest): Promise<void> {
            return rev.put(`/api/v2/channels/${channelId}`, channel);
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
        }
    };
    return channelAPI;
}

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
