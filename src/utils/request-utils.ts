import type { RevClient } from '../rev-client';
import type { Rev } from '../types';

export async function decodeBody(response: Response, acceptType?: string) {
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
 * Private helper function for scrolling through Search API results that return a "scrollId"
 */
export async function* searchScrollStream<RawType>(
    rev: RevClient,
    searchOptions: { endpoint: string, totalKey: string, hitsKey: string, isPost?: boolean; },
    data: Record<string, any>,
    options: Rev.SearchOptions<RawType>
): AsyncGenerator<RawType> {
    const {
        endpoint,
        totalKey,
        hitsKey,
        isPost = false
    } = searchOptions;

    const {
        maxResults = Infinity,
        onPage = (items, index, total) => {
            rev.log('debug', `searching ${hitsKey}, ${index}-${index + items.length} of ${total}...`);
        }
    } = options;

    const query = { ...data };
    delete query.scrollId;

    let total = maxResults;
    let current = 0;
    // continue until max reached
    while (current < maxResults) {
        const response: Record<string, any> = await isPost
            ? rev.post(endpoint, query, { responseType: 'json' })
            : rev.get(endpoint, query, { responseType: 'json' });

        let {
            scrollId,
            [totalKey]: responseTotal,
            [hitsKey]: items
        } = response;

        query.scrollId = scrollId;
        total = Math.min(responseTotal, maxResults);

        // limit results to specified max results
        if (current + items.length >= maxResults) {
            const delta = maxResults - current;
            items = items.slice(0, delta);
        }

        onPage(items, current, total);
        current += items.length;

        for (let item of items) {
            yield item;
        }

        // if no scrollId returned then no more results to page through
        if (!scrollId) {
            return;
        }
    }
}
