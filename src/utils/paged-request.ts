import { Rev } from '../types/rev';

/**
 * A page of results returned from `.nextPage()`
 * @category Utilities
 */
export interface IPageResponse<T> {
    items: T[],
    done: boolean,
    total?: number,
    pageCount?: number,
    error?: Error
}

/**
 * Interface to iterate through results from API endpoints that return results in pages.
 * Use in one of three ways:
 * 1) Get all results as an array: `await request.exec() == <array>`
 * 2) Get each page of results: `await request.nextPage() == { current, total, items: <array> }`
 * 3) Use for await to get all results one at a time: `for await (let hit of request) { }`
 * @category Utilities
 */
export abstract class PagedRequest<ItemType> implements Rev.ISearchRequest<ItemType> {
    current: number;
    total: number | undefined;
    done: boolean;
    options: Required<Rev.SearchOptions<ItemType>>;
    /**
     * @hidden
     * @param options
     */
    constructor(options: Rev.SearchOptions<ItemType> = {}) {
        this.options = {
            maxResults: Infinity,
            onProgress: (items: ItemType[], current: number, total?: number) => {},
            onError: (err => { throw err; }),
            onScrollError: (err => {
                console.warn("DEPRECATED: use onError instead of onScrollError with rev search requests");
                this.options.onError(err);
            }),
            signal: undefined as any,
            ...options
        };

        this.current = 0;
        this.total = undefined;
        this.done = false;
    }
    protected abstract _requestPage(): Promise<IPageResponse<ItemType>>;
    /**
     * Get the next page of results from API
     */
    async nextPage(): Promise<Rev.SearchPage<ItemType>> {
        const {
            onProgress,
            onError,
            signal
        } = this.options;

        if (signal?.aborted) this.done = true;

        if (this.done) {
            return {
                current: this.current,
                total: this.current,
                done: this.done,
                items: []
            };
        }

        const page = await this._requestPage();
        const result = this._parsePage(page);

        let {
            current,
            items,
            total,
            done,
            error
        } = result;

        onProgress(items, current, total);

        if (error) {
            onError(error);
        }

        return {
            current,
            items,
            total,
            done
        };
    }
    /**
     * update internal variables based on API response
     * @param page
     * @returns
     */
    protected _parsePage(page: IPageResponse<ItemType>) {
        const { maxResults } = this.options;

        let {
            items = [],
            done = this.done,
            total,
            pageCount,
            error,
        } = page;

        // let request function set done status
        if (done) {
            this.done = true;
        }

        // update total
        if (isFinite(total!)) {
            this.total = Math.min(total!, maxResults);
        }

        if (!pageCount) {
            pageCount = items.length;
        }

        const current = this.current;

        // limit results to specified max results
        if (current + pageCount >= maxResults) {
            pageCount = maxResults - current;
            items = items.slice(0, pageCount);
            this.done = true;
        }

        this.current += pageCount;

        if (this.current === this.total) {
            this.done = true;
        }

        if (this.done) {
            // set total to current for results where not otherwise known in advance
            this.total = this.current;
        }

        if (error) {
            this.done = true;
        }

        return {
            current,
            total: this.total,
            done: this.done,
            error,
            items
        };
    }
    /**
     * Go through all pages of results and return as an array.
     * TIP: Use the {maxResults} option to limit the maximum number of results
     *
     */
    async exec(): Promise<ItemType[]> {
        const results: ItemType[] = [];
        // use async iterator
        for await (let hit of this) {
            results.push(hit);
        }
        return results;
    }
    /**
     * Supports iterating through results using for await...
     * @see [MDN Docs](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for-await...of)
     */
    async* [Symbol.asyncIterator]() {
        const {signal} = this.options;
        do {
            const {
                items
            } = await this.nextPage();

            for await (let hit of items) {
                if (signal?.aborted) break;
                yield hit;
            }
        } while (!this.done);
    }
}

