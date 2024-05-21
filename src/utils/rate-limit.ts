import polyfills from '../interop';

const ONE_MINUTE = 60 * 1000;

interface RateLimitOptions{
    /**
     * how many to allow in parallel in any given interval
     * @default 1
     */
    limit?: number,
    /**
     * interval in milliseconds
     */
    interval?: number,
    /**
     * set limit to X per second
     */
    perSecond?: number,
    /**
     * set limit to X per minute (can be fraction, i.e. 0.5 for 1 every 2 minutes)
     */
    perMinute?: number,
    /**
     * set limit to X per hour
     */
    perHour?: number,
    /**
     * cancel with AbortController
     */
    signal?: AbortSignal
}

export type ThrottledFunction<T extends (...args: any[]) => any> = (
    (...args: Parameters<T>) => ReturnType<T> extends PromiseLike<infer Return> ? Promise<Return> : Promise<ReturnType<T>>
) & {
    /**
     * Abort pending executions. All unresolved promises are rejected with a `AbortError` error.
     * @param {string} [message] - message parameter for rejected AbortError
     * @param {boolean} [dispose] - remove abort signal listener as well
     */
    abort: (message?: string, dispose?: boolean) => void;
};

interface RateLimitOptionsWithFn<T> extends RateLimitOptions {
    /**
     * function to rate limit
     */
    fn: T
}
function rateLimit<T extends (...args: any) => any>(options: RateLimitOptionsWithFn<T>): ThrottledFunction<T>;
function rateLimit<T extends (...args: any) => any>(fn: T, options: RateLimitOptions): ThrottledFunction<T>;
function rateLimit<T extends (...args: any) => any>(fn: T | RateLimitOptionsWithFn<T>, options?: RateLimitOptions): ThrottledFunction<T>;

// adapted from https://github.com/sindresorhus/p-throttle
function rateLimit<T extends (...args: any) => any> (fn: T | RateLimitOptionsWithFn<T>, options: RateLimitOptions = {}) {
    if (fn && (typeof fn === 'object')) {
        options = Object.assign({}, fn, options);
        fn = undefined as unknown as T;
    }
    if (!fn) {
        fn = (options as RateLimitOptionsWithFn<T>).fn;
    }

    if (typeof fn !== 'function') {
        throw new TypeError('Rate limit function is not a function');
    }

    const {
        perSecond,
        perMinute,
        perHour,
        signal
    } = options;

    let limit = parseFloat(options.limit as unknown as string) || 1;
    let interval = parseInt(options.interval as unknown as string, 10);

    if (perSecond) {
        limit = parseFloat(perSecond as unknown as string);
        interval = 1000;
    }
    if (perMinute) {
        limit = parseFloat(perMinute as unknown as string);
        interval = ONE_MINUTE;
    }
    if (perHour) {
        limit = parseFloat(perHour as unknown as string);
        interval = ONE_MINUTE * 60;
    }

    if (limit < 1) {
        interval /= limit;
        limit = 1;
    } else {
        // just make sure it isn't a faction for some silly reason
        limit = Math.floor(limit);
    }

    if (!Number.isFinite(limit)) {
        throw new TypeError(`Invalid limit ${limit}`);
    }

    if (!Number.isFinite(interval) || interval <= 0) {
        throw new TypeError('Invalid interval option');
    }

    const queue:Map<NodeJS.Timeout, (err: Error) => any> = new Map();

    let currentTick = 0;
    let activeCount = 0;

    type Return = ReturnType<T> extends PromiseLike<infer R> ? Promise<R> : Promise<ReturnType<T>>;

    const throttled = function (...args: Parameters<T>) {
        let timeout: NodeJS.Timeout;
        return new Promise((resolve, reject) => {
            const execute = () => {
                resolve((fn as T).apply(null, args));
                queue.delete(timeout);
            };

            const now = Date.now();

            if ((now - currentTick) > interval) {
                activeCount = 1;
                currentTick = now;
            } else if (activeCount < limit) {
                activeCount++;
            } else {
                currentTick += interval;
                activeCount = 1;
            }

            timeout = setTimeout(execute, currentTick - now);

            // used for sending cancel error
            queue.set(timeout, reject);
        }) as Return;
    };

    let abortHandler = signal
        ? () => throttled.abort(signal.reason ? `${signal.reason}` : undefined, true)
        : undefined;

    throttled.abort = (message: string = 'Cancelled rate-limit queue', dispose: boolean = false) => {
        if (dispose) {
            signal?.removeEventListener('abort', abortHandler!);
        }
        for (const [timeout, reject] of queue.entries()) {
            clearTimeout(timeout);
            reject(polyfills.createAbortError(message));
        }

        queue.clear();
    };

    signal?.addEventListener('abort', abortHandler!);

    return throttled;
}

export default rateLimit;
