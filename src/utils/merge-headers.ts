import polyfills from '../interop/polyfills';

export function mergeHeaders(source?: HeadersInit, other?: HeadersInit) {
    const merged = new polyfills.Headers(source);
    new polyfills.Headers(other).forEach((value, key) => merged.set(key, value));
    return merged;
}
