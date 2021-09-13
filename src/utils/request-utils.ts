import { ScrollError } from '../rev-error';
import type { RevClient } from '../rev-client';
import type { Rev } from '../types';

export async function decodeBody(response: Response, acceptType?: string | null) {
    const contentType = response.headers.get('Content-Type') || acceptType || '';

    if (contentType.startsWith('application/json')) {
        try {
            return await response.json();
        } catch (err) {
            // keep going
        }
    }

    if (contentType.startsWith('text')) {
        return response.text();
    }

    return response.body;
}

/**
 * Interface to iterate through results from API endpoints that return results in pages.
 * Use in one of three ways:
 * 1) Get all results as an array: await request.exec() == <array>
 * 2) Get each page of results: await request.nextPage() == { current, total, items: <array> }
 * 3) Use for await to get all results one at a time: for await (let hit of request) { }
 */
export class SearchRequest<T> implements Rev.ISearchRequest<T> {
    current: number;
    total: number;
    done: boolean;
    options: Required<Rev.SearchOptions<T>>;
    private _req: (...args: any[]) => any;
    private query: Record<string, any>;
    constructor(
        rev: RevClient,
        searchDefinition: Rev.SearchDefinition<T>,
        query: Record<string, any> = {},
        options: Rev.SearchOptions<T> = {}
    ) {
        // make copy of query object
        const {
            scrollId: _ignore,
            ...queryOpt
        } = query;
        this.query = queryOpt;

        const {
            hitsKey
        } = searchDefinition;

        this.options = {
            maxResults: Infinity,
            onProgress: (items, current, total) => {
                rev.log('debug', `searching ${hitsKey}, ${current}-${current + items.length} of ${total}...`);
            },
            onScrollExpired: (err => { throw err; }),
            ...options
        };

        this._req = this._makeReqFunction(rev, searchDefinition);

        this.current = 0;
        this.total = Infinity;
        this.done = false;
    }
    private _makeReqFunction(rev: RevClient, searchDefinition: Rev.SearchDefinition) {
        const {
            endpoint,
            totalKey,
            hitsKey,
            isPost = false,
            transform
        } = searchDefinition;

        return async (query: Record<string, any>) => {
            const response: Record<string, any> = isPost
                ? await rev.post(endpoint, query, { responseType: 'json' })
                : await rev.get(endpoint, query, { responseType: 'json' });

            let {
                scrollId,
                [totalKey]: total,
                [hitsKey]: rawItems = [],
                statusCode,
                statusDescription
            } = response;

            const items: T[] = (typeof transform === 'function')
                ? await Promise.resolve(transform(rawItems))
                : rawItems;

            return {
                scrollId,
                total,
                pageCount: rawItems.count,
                items,
                statusCode,
                statusDescription
            };
        };
    }
    /**
     * Get the next page of results from API
     */
    async nextPage(): Promise<Rev.SearchPage<T>> {
        const {
            maxResults,
            onProgress,
            onScrollExpired
        } = this.options;

        if (this.done) {
            return {
                current: this.total,
                total: this.total,
                done: this.done,
                items: []
            };
        }

        let {
            scrollId,
            total = 0,
            items = [],
            pageCount = 0,
            statusCode,
            statusDescription
        } = await this._req(this.query);

        this.total = Math.min(total, maxResults);

        this.query.scrollId = scrollId;
        if (!scrollId) {
            this.done = true;
        }

        const current = this.current;

        // limit results to specified max results
        if (current + pageCount >= maxResults) {
            const delta = maxResults - current;
            items = items.slice(0, delta);
            this.done = true;
        }

        onProgress(items, current, this.total);

        // check for error response
        if (statusCode >= 400 && !!statusDescription) {
            this.done = true;
            const err = new ScrollError(statusCode, statusDescription);
            onScrollExpired(err);
        }

        this.current += pageCount;

        if (this.current === this.total) {
            this.done = true;
        }

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
    async exec(): Promise<T[]> {
        const results: T[] = [];
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
