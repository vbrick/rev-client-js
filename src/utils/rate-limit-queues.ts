import rateLimit, {ThrottledFunction} from "./rate-limit";

export enum RateLimitEnum {
    Get = 'get',
    Post = 'post',
    SearchVideos = 'searchVideos',
    UploadVideo = 'uploadVideo',
    AuditEndpoints = 'auditEndpoint',
    UpdateVideoMetadata = 'updateVideo',
    GetUsersByLoginDate = 'loginReport',
    GetVideoDetails = 'videoDetails',
    GetWebcastAttendeesRealtime = 'attendeesRealtime',
    GetVideoViewReport = 'viewReport'
}

export type RateLimits = { [K in RateLimitEnum]?: number }
export type RateLimitQueues = { [K in RateLimitEnum]?: () => Promise<void> };

export const defaultRateLimits: Required<RateLimits> = {
    [RateLimitEnum.Get]: 24000,
    [RateLimitEnum.Post]: 3600,
    [RateLimitEnum.SearchVideos]: 120,
    [RateLimitEnum.UploadVideo]: 30,
    [RateLimitEnum.UpdateVideoMetadata]: 30,
    [RateLimitEnum.GetVideoDetails]: 2000,
    [RateLimitEnum.GetWebcastAttendeesRealtime]: 2,
    [RateLimitEnum.AuditEndpoints]: 60,
    [RateLimitEnum.GetUsersByLoginDate]: 10,
    [RateLimitEnum.GetVideoViewReport]: 120,
};

// passthrough placeholder for ratelimit
const fn = () => Promise.resolve();

export function normalizeRateLimitOptions(rateLimits?: boolean | RateLimits): RateLimits {
    return {
        // include defaults if true or object
        ...rateLimits && defaultRateLimits,
        ...(typeof rateLimits === 'object') && rateLimits
    };
}

export function makeQueue(key: RateLimitEnum, value?: number) {
    const defaultValue = defaultRateLimits[key];
    const perMinute = value ?? defaultValue;
    // 0, -1, null or Infinity get treated as no rate limiting
    if (!isFinite(perMinute) || perMinute <= 0) {
        return fn;
    }
    // split into 5 sec increments to even out request flow
    const limit = perMinute / 12;
    const interval = 5000;
    return rateLimit({ fn, limit, interval });
}

/**
 * create a dict of rate limited-locks based on input options
 * @param rateLimits
 * @returns
 */
export function makeQueues(rateLimits: RateLimits = {}): RateLimitQueues {
    const entries = (Object.keys(defaultRateLimits) as RateLimitEnum[])
        .map(key => [key, makeQueue(key, rateLimits[key])]);

    return Object.fromEntries(entries);
}

export function clearQueues(rateLimits: RateLimitQueues, message?: string) {
    const fns = Object.values(rateLimits) as Array<Partial<ThrottledFunction<() => void>>>;
    fns.forEach(fn => fn.abort?.(message));
}
