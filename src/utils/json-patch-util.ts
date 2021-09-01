function titleCase(val: string) {
    return `${val[0]}${val.slice(1)}`;
}

// exclude 0 / false from falsy check
function isBlank(val: any) {
    return val == undefined || val === '';
}

function coerceDateString(value: unknown): string {
    if (isBlank(value)) {
        return;
    }
    // check if already in correct format
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
        return value;
    }

    const date = new Date(value as any);
    if (isNaN(date.getTime())) {
        return;
    }
    return date.toISOString();
}

export const patchOperations = {
    add(key: string, value: any) {
        return { op: 'add', path: `/${titleCase(key)}`, value };
    },
    bool(key: string, value: any) {
        return patchOperations.add(key, !!value);
    },
    shortDate(key: string, value: unknown) {
        const strVal = coerceDateString(value);
        return patchOperations.add(key, strVal?.slice(0, 10));
    },
    date(key: string, value: unknown) {
        const strVal = coerceDateString(value);
        return patchOperations.add(key, strVal);
    }
};


