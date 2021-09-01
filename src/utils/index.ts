import { Rev } from '..';

const { toString: _toString } = Object.prototype;

export function isPlainObject<T = { [key: string]: any; } | any[]>(val: unknown): val is T {
    if (_toString.call(val) !== '[object Object]') {
        return false;
    }
    const prototype = Object.getPrototypeOf(val);
    return prototype === null || prototype === Object.getPrototypeOf({ });
}

export function isBlobLike(val: unknown): val is Blob | File {
    return typeof (val as Blob)?.stream === 'function';
}

export function isReadable<T = any>(val: unknown): val is AsyncIterable<T> {
    return typeof (val as AsyncIterable<T>)[Symbol.asyncIterator] === 'function';
}

/**
 * Retry a function multiple times, sleeping before attempts
 * @param {() => Promise<T>} fn function to attempt. Return value if no error thrown
 * @param {(err: Error, attempt: number) => boolean} [shouldRetry] callback on error.
 * @param {number} [maxAttempts] maximum number of retry attempts before throwing error
 * @param {number} [sleepMilliseconds] milliseconds to wait between attempts
 * @returns {Promise<T>}
 */
export async function retry<T>(fn: () => Promise<T>, shouldRetry: (err: Error, attempt: number) => boolean = () => true, maxAttempts: number = 3, sleepMilliseconds: number = 1000) {
    let attempt = 0;
    while (attempt < maxAttempts) {
        try {
            const result = await fn();
            return result;
        } catch (err) {
            attempt += 1;
            if (attempt >= maxAttempts || !shouldRetry(err, attempt)) {
                throw err;
            }
            await sleep(sleepMilliseconds);
        }
    }
}

/**
 * delay async execution, with optional early exit using abort signal
 * @param ms
 * @param signal
 * @returns
 */
export async function sleep(ms: number, signal?: AbortSignal) {
    return new Promise<void>(done => {
        let timer: ReturnType<typeof setTimeout>;
        const cleanup = () => {
            clearTimeout(timer);
            signal?.removeEventListener('abort', cleanup);
            done();
        };
        timer = setTimeout(done, ms);
        signal?.addEventListener('abort', cleanup);
    });
}

/** try to parse as json */
export function tryParseJson(val: string): any {
    if (val !== 'null' && val) {
        try {
            return JSON.parse(val);
        } catch (err) {
            // nothing
        }
    }
    return null;
};
