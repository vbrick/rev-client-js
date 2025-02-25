import { ScrollError } from '../rev-error';
import type { RevClient } from '../rev-client';
import type { Rev } from '../types/index';
import { IPageResponse, PagedRequest } from './paged-request';

export async function decodeBody(response: Response, acceptType?: string | null) {
    const contentType = response.headers.get('Content-Type') || acceptType || '';
    const contentLength = response.headers.get('Content-Length');

    if (contentType.startsWith('application/json') && contentLength !== '0') {
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
 * 1) Get all results as an array: `await request.exec() == <array>`
 * 2) Get each page of results: `await request.nextPage() == { current, total, items: <array> }`
 * 3) Use for await to get all results one at a time: `for await (let hit of request) { }`
 * @category Utilities
 */
export class SearchRequest<T> extends PagedRequest<T> {
    declare options: Required<Rev.SearchOptions<T>>;
    private query: Record<string, any>;
    private _reqImpl: () => Promise<IPageResponse<T>>;
    constructor(
        rev: RevClient,
        searchDefinition: Rev.SearchDefinition<T>,
        query: Record<string, any> = {},
        options: Rev.SearchOptions<T> = {}
    ) {
        super({
            onProgress: (items: T[], current: number, total?: number | undefined) => {
                const {hitsKey} = searchDefinition;
                rev.log('debug', `searching ${hitsKey}, ${current}-${current + items.length} of ${total}...`);
            },
            onError: (err => { throw err; }),
            ...options
        });

        // make copy of query object
        const {
            scrollId: _ignore,
            ...queryOpt
        } = query;
        this.query = queryOpt;

        this._reqImpl = this._buildReqFunction(rev, searchDefinition);

        this.current = 0;
        this.total = Infinity;
        this.done = false;
    }
    protected _requestPage() {
        return this._reqImpl();
    }
    private _buildReqFunction(rev: RevClient, searchDefinition: Rev.SearchDefinition<T>) {
        const {
            endpoint,
            totalKey,
            hitsKey,
            isPost = false,
            request,
            transform
        } = searchDefinition;

        const requestFn = request || (isPost
            ? rev.post.bind(rev)
            : rev.get.bind(rev)
        );

        return async () => {

            const response: Record<string, any> = await requestFn(endpoint, this.query, { responseType: 'json' });

            let {
                scrollId,
                [totalKey]: total,
                [hitsKey]: rawItems = [],
                statusCode,
                statusDescription
            } = response;

            let done = false;

            this.query.scrollId = scrollId;
            if (!scrollId) {
                done = true;
            }

            const items: T[] = (typeof transform === 'function')
                ? await Promise.resolve(transform(rawItems))
                : rawItems;

            if (items.length === 0) {
                done = true;
            }

            // check for error response
            const error = (statusCode >= 400 && !!statusDescription)
                ? new ScrollError(statusCode, statusDescription)
                : undefined;

            return {
                total,
                done,
                pageCount: rawItems.length,
                items,
                error
            };
        };
    }
}
