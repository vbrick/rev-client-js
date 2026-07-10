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
    return typeof (val as AsyncIterable<T>)?.[Symbol.asyncIterator] === 'function';
}

export function isResponseLike(val: unknown): val is Response {
    const _res = val as Response | undefined;
    return (
        !!val &&
        typeof val === 'object' &&
        isReadable(_res?.body) &&
        typeof _res.headers === 'object' &&
        _res.url != null
    );
}

export function isFormData(val: unknown): val is FormData {
    return (
        !!val &&
        typeof val === 'object' &&
        // as of 2026 typescript doesn't have toStringTag typed for all native dom objects
        (val as { [Symbol.toStringTag]: string })[Symbol.toStringTag] ===
            'FormData' &&
        typeof (val as FormData).entries === 'function'
    );
}

export function titleCase(val: string) {
    return `${val[0]}${val.slice(1)}`;
}

// exclude 0 / false from falsy check
export function isBlank(val: unknown) {
    return val == null || val === '';
}
