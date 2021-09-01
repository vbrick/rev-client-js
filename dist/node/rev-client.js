'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var fs = require('fs');
var path = require('path');
var crypto$1 = require('crypto');
var util = require('util');
var fetch = require('node-fetch');
var FormData = require('form-data');
var nodeAbortController = require('node-abort-controller');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);
var path__default = /*#__PURE__*/_interopDefaultLegacy(path);
var fetch__default = /*#__PURE__*/_interopDefaultLegacy(fetch);
var FormData__default = /*#__PURE__*/_interopDefaultLegacy(FormData);

const { toString: _toString } = Object.prototype;
function isPlainObject(val) {
    if (_toString.call(val) !== '[object Object]') {
        return false;
    }
    const prototype = Object.getPrototypeOf(val);
    return prototype === null || prototype === Object.getPrototypeOf({});
}
function isBlobLike(val) {
    return typeof val?.stream === 'function';
}
function isReadable(val) {
    return typeof val[Symbol.asyncIterator] === 'function';
}
/**
 * Retry a function multiple times, sleeping before attempts
 * @param {() => Promise<T>} fn function to attempt. Return value if no error thrown
 * @param {(err: Error, attempt: number) => boolean} [shouldRetry] callback on error.
 * @param {number} [maxAttempts] maximum number of retry attempts before throwing error
 * @param {number} [sleepMilliseconds] milliseconds to wait between attempts
 * @returns {Promise<T>}
 */
async function retry(fn, shouldRetry = () => true, maxAttempts = 3, sleepMilliseconds = 1000) {
    let attempt = 0;
    while (attempt < maxAttempts) {
        try {
            const result = await fn();
            return result;
        }
        catch (err) {
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
async function sleep(ms, signal) {
    return new Promise(done => {
        let timer;
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
function tryParseJson(val) {
    if (val !== 'null' && val) {
        try {
            return JSON.parse(val);
        }
        catch (err) {
            // nothing
        }
    }
    return null;
}

class RevError extends Error {
    constructor(response, body) {
        const { status = 500, statusText = '', url } = response;
        super(`${status} ${statusText}`);
        // Chrome/node specific function
        if ('captureStackTrace' in Error) {
            Error.captureStackTrace(this, this.constructor);
        }
        this.status = status;
        this.url = url;
        this.code = `${status}`;
        this.detail = statusText;
        // Some Rev API responses include additional details in its body
        if (isPlainObject(body)) {
            if (body.code) {
                this.code = body.code;
            }
            if (body.detail) {
                this.detail = body.detail;
            }
        }
        else if (typeof body === 'string') {
            body = body.trim();
            // try to parse as JSON
            if (body.startsWith('{')) {
                const { code, detail } = tryParseJson(body) || {};
                if (code) {
                    this.code = code;
                }
                if (detail) {
                    this.detail = detail;
                }
            }
            else if (this.status === 429) {
                this.detail = 'Too Many Requests';
            }
            else if (/^(<!DOCTYPE|<html)/.test(body)) {
                // if html then strip out the extra cruft
                this.detail = body
                    .replace(/.*<body>\s+/s, '')
                    .replace(/<\/body>.*/s, '')
                    .slice(0, 256);
            }
        }
    }
    get name() {
        return this.constructor.name;
    }
    get [Symbol.toStringTag]() {
        return this.constructor.name;
    }
    static async create(response) {
        let body;
        try {
            // retrieve body - constructor will decode as json
            body = await response.text();
        }
        catch (err) {
            body = {
                code: 'Unknown',
                detail: `Unable to parse error response body: ${err}`
            };
        }
        return new RevError(response, body);
    }
}

function adminAPIFactory(rev) {
    let roles;
    let customFields;
    const adminAPI = {
        /**
        * get mapping of role names to role IDs
        * @param cache - if true allow storing/retrieving from cached values. 'Force' means refresh value saved in cache
        */
        async roles(cache = true) {
            // retrieve from cached values if already stored. otherwise get from API
            // if cache is 'Force' then refresh from
            if (roles && cache === true) {
                return roles;
            }
            const response = await rev.get('/api/v2/users/roles');
            if (cache) {
                roles = response;
            }
            return response;
        },
        /**
        * Get a Role (with the role id) based on its name
        * @param name Name of the Role, i.e. "Media Viewer"
        * @param fromCache - if true then use previously cached Role listing (more efficient)
        */
        async getRoleByName(name, fromCache = true) {
            const roles = await adminAPI.roles(fromCache);
            const role = roles.find(r => r.name === name);
            return {
                id: role.id,
                name: role.name
            };
        },
        /**
        * get list of custom fields
        * @param cache - if true allow storing/retrieving from cached values. 'Force' means refresh value saved in cache
        */
        async customFields(cache = true) {
            // retrieve from cached values if already stored. otherwise get from API
            // if cache is 'Force' then refresh from
            if (customFields && cache === true) {
                return customFields;
            }
            const response = await rev.get('/api/v2/video-fields', undefined, { responseType: 'json' });
            if (cache) {
                customFields = response;
            }
            return response;
        },
        /**
        * Get a Custom Field based on its name
        * @param name name of the Custom Field
        * @param fromCache if true then use previously cached Role listing (more efficient)
        */
        async getCustomFieldByName(name, fromCache = true) {
            const customFields = await adminAPI.customFields(fromCache);
            return customFields.find(cf => cf.name === name);
        },
        async brandingSettings() {
            return rev.get('/api/v2/accounts/branding-settings');
        },
        /**
        * get system health - returns 200 if system is active and responding, otherwise throws error
        */
        async verifySystemHealth() {
            await rev.get('/api/v2/system-health');
            return true;
        },
        /**
        * gets list of scheduled maintenance windows
        */
        async maintenanceSchedule() {
            const { schedules } = await rev.get('/api/v2/maintenance-schedule');
            return schedules;
        }
    };
    return adminAPI;
}

/**
 * simple helper function to parse CSV data into JSON
 */
function parseCSV(raw) {
    raw = raw.replace(/(\r\n|\n|\r)/gm, '\n').replace(/\n$/g, '');
    let cur = '';
    let inQuote = false;
    let fieldQuoted = false;
    let field = '';
    let row = [];
    let out = [];
    let i;
    const n = raw.length;
    function processField(field) {
        if (fieldQuoted) {
            return field;
        }
        if (field === '') {
            return undefined;
        }
        return field.trim();
    }
    for (i = 0; i < n; i += 1) {
        cur = raw.charAt(i);
        if (!inQuote && (cur === ',' || cur === '\n')) {
            field = processField(field);
            row.push(field);
            if (cur === '\n') {
                out.push(row);
                row = [];
            }
            field = '';
            fieldQuoted = false;
        }
        else if (cur === '"') {
            if (!inQuote) {
                inQuote = true;
                fieldQuoted = true;
            }
            else {
                if (raw.charAt(i + 1) === '"') {
                    field += '"';
                    i += 1;
                }
                else {
                    inQuote = false;
                }
            }
        }
        else {
            field += cur === '\n' ? '\n' : cur;
        }
    }
    // Add the last field
    field = processField(field);
    row.push(field);
    out.push(row);
    const headers = out.shift();
    return out
        .map((line) => {
        const obj = {};
        line
            .forEach((field, i) => {
            if (field !== undefined) {
                obj[headers[i]] = field;
            }
        });
        return obj;
    });
}

function auditAPIFactory(rev) {
    const auditAPI = {
        /**
        * return audit endpoints as stream of items (AsyncIterator)
        */
        stream: {
            /**
            * Logs of user login / logout / failed login activity
            */
            accountAccess(accountId, options) {
                return scroll(`/network/audit/accounts/${accountId}/userAccess`, 'UserAccess', options);
            },
            userAccess(userId, accountId, options) {
                return scroll(`/network/audit/accounts/${accountId}/userAccess/${userId}`, `UserAccess_${userId}`, options);
            },
            /**
            * Operations on User Records (create, delete, etc)
            */
            accountUsers(accountId, options) {
                return scroll(`/network/audit/accounts/${accountId}/userAccess`, 'User', options);
            },
            user(userId, accountId, options) {
                return scroll(`/network/audit/accounts/${accountId}/userAccess/${userId}`, 'User', options);
            },
            /**
            * Operations on Group Records (create, delete, etc)
            */
            accountGroups(accountId, options) {
                return scroll(`/network/audit/accounts/${accountId}/groups`, 'Groups', options);
            },
            group(groupId, accountId, options) {
                return scroll(`/network/audit/accounts/${accountId}/groups/${groupId}`, 'Group', options);
            },
            /**
            * Operations on Device Records (create, delete, etc)
            */
            accountDevices(accountId, options) {
                return scroll(`/network/audit/accounts/${accountId}/devices`, 'Devices', options);
            },
            device(deviceId, accountId, options) {
                return scroll(`/network/audit/accounts/${accountId}/devices/${deviceId}`, 'Device', options);
            },
            /**
            * Operations on Video Records (create, delete, etc)
            */
            accountVideos(accountId, options) {
                return scroll(`/network/audit/accounts/${accountId}/videos`, 'Videos', options);
            },
            video(videoId, accountId, options) {
                return scroll(`/network/audit/accounts/${accountId}/videos/${videoId}`, 'Video', options);
            },
            /**
            * Operations on Webcast Records (create, delete, etc)
            */
            accountWebcasts(accountId, options) {
                return scroll(`/network/audit/accounts/${accountId}/scheduledEvents`, 'Webcasts', options);
            },
            webcast(eventId, accountId, options) {
                return scroll(`/network/audit/accounts/${accountId}/scheduledEvents/${eventId}`, `Webcast`, options);
            },
            /**
            * All operations a single user has made
            */
            principal(userId, accountId, options) {
                return scroll(`/network/audit/accounts/${accountId}/principals/${userId}`, 'Principal', options);
            }
        },
        /**
        * Logs of user login / logout / failed login activity
        */
        async accountAccess(accountId, options) {
            return collect(auditAPI.stream.accountAccess(accountId, options));
        },
        async userAccess(userId, accountId, options) {
            return collect(auditAPI.stream.userAccess(userId, accountId, options));
        },
        /**
        * Operations on User Records (create, delete, etc)
        */
        async accountUsers(accountId, options) {
            return collect(auditAPI.stream.accountUsers(accountId, options));
        },
        async user(userId, accountId, options) {
            return collect(auditAPI.stream.user(userId, accountId, options));
        },
        /**
        * Operations on Group Records (create, delete, etc)
        */
        async accountGroups(accountId, options) {
            return collect(auditAPI.stream.accountGroups(accountId, options));
        },
        async group(groupId, accountId, options) {
            return collect(auditAPI.stream.group(groupId, accountId, options));
        },
        /**
        * Operations on Device Records (create, delete, etc)
        */
        async accountDevices(accountId, options) {
            return collect(auditAPI.stream.accountDevices(accountId, options));
        },
        async device(deviceId, accountId, options) {
            return collect(auditAPI.stream.device(deviceId, accountId, options));
        },
        /**
        * Operations on Video Records (create, delete, etc)
        */
        async accountVideos(accountId, options) {
            return collect(auditAPI.stream.accountVideos(accountId, options));
        },
        async video(videoId, accountId, options) {
            return collect(auditAPI.stream.video(videoId, accountId, options));
        },
        /**
        * Operations on Webcast Records (create, delete, etc)
        */
        async accountWebcasts(accountId, options) {
            return collect(auditAPI.stream.accountWebcasts(accountId, options));
        },
        async webcast(eventId, accountId, options) {
            return collect(auditAPI.stream.webcast(eventId, accountId, options));
        },
        /**
        * All operations a single user has made
        */
        async principal(userId, accountId, options) {
            return collect(auditAPI.stream.principal(userId, accountId, options));
        }
    };
    function asValidDate(val, defaultValue) {
        if (!val) {
            return defaultValue;
        }
        if (!(val instanceof Date)) {
            val = new Date(val);
        }
        return isNaN(val.getTime())
            ? defaultValue
            : val;
    }
    function parseEntry(line) {
        return {
            messageKey: line['MessageKey'],
            entityKey: line['EntityKey'],
            when: line['When'],
            principal: tryParseJson(line['Principal']) || {},
            message: tryParseJson(line['Message']) || {},
            currentState: tryParseJson(line['CurrentState']) || {},
            previousState: tryParseJson(line['PreviousState']) || {}
        };
    }
    async function* scroll(endpoint, label, options = {}) {
        const { maxResults = Infinity, onPage = (current, total) => {
            rev.log('debug', `loading ${label}, ${current} of ${total}...`);
        }, fromDate, toDate } = options;
        let _toDate = asValidDate(toDate, new Date());
        // default to one year older than toDate
        const defaultFrom = new Date(_toDate.setFullYear(_toDate.getFullYear() - 1));
        let _fromDate = asValidDate(fromDate, defaultFrom);
        if (_toDate < _fromDate) {
            [_toDate, _fromDate] = [_fromDate, _toDate];
        }
        const params = {
            toDate: _toDate.toISOString(),
            fromDate: _fromDate.toISOString()
        };
        let current = 0;
        let total;
        do {
            try {
                const response = await rev.request('GET', endpoint, { params });
                let lines = parseCSV(response.body);
                // limit results to specified max results
                if (current + lines.length >= maxResults) {
                    const delta = maxResults - current;
                    lines = lines.slice(0, delta);
                }
                current += lines.length;
                if (!total) {
                    total = Math.min(parseInt(response.headers.get('totalRecords'), 10), maxResults);
                }
                onPage(current, total || 0);
                if (lines.length === 0) {
                    return;
                }
                for (let entry of lines) {
                    yield parseEntry(entry);
                }
                params.nextContinuationToken = response.headers.get('nextContinuationToken');
                params.fromDate = response.headers.get('nextfromDate');
            }
            catch (err) {
                rev.log('warn', err);
                throw err;
            }
        } while (params.nextContinuationToken && current < maxResults);
    }
    /**
    * takes an async stream of items and collects them into an array
    * @param stream
    */
    async function collect(stream) {
        const records = [];
        for await (let record of stream) {
            records.push(record);
        }
        return records;
    }
    return auditAPI;
}

/**
 * There are slight differences in handling browser and node.js environments.
 * This folder wraps all components that get polyfilled in node.js, as well as
 * allowing uploading a video from the local filesystem on node.js
 */
/**
 * used to sign the verifier in OAuth workflow
 */
async function hmacSign$1(message, secret) {
    const enc = new TextEncoder();
    const cryptoKey = await crypto.subtle
        .importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, true, ['sign']);
    const signed = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(message));
    return btoa(String.fromCharCode(...new Uint8Array(signed)));
}
var polyfills = {
    AbortController: globalThis.AbortController,
    AbortSignal: globalThis.AbortSignal,
    fetch: (...args) => globalThis.fetch(...args),
    FormData: globalThis.FormData,
    Headers: globalThis.Headers,
    Request: globalThis.Request,
    Response: globalThis.Response,
    hmacSign: hmacSign$1,
    /**
     *
     * @param file
     * @param filename
     * @param contentType
     * @returns
     */
    async parseFileUpload(file, options) {
        let { filename, contentType, contentLength } = options;
        if (isBlobLike(file)) {
            const { type, name, size } = file;
            if (type && !contentType) {
                contentType = type;
            }
            if (name && !filename) {
                filename = name;
            }
            if (size && !contentLength) {
                contentLength = size;
            }
            return {
                file,
                options: {
                    ...options,
                    filename,
                    contentType,
                    contentLength
                }
            };
        }
        throw new TypeError('Only Blob / Files are supported for file uploads. Pass a File/Blob object');
    },
    appendFileToForm(form, fieldName, payload) {
        const { file, options: { filename } } = payload;
        form.append(fieldName, file, filename);
    },
    async prepareUploadHeaders(form, headers, useChunkedTransfer) {
        // nothing - this is used for fixing node's form-data behavior
    }
};

function authAPIFactory(rev) {
    const { hmacSign } = polyfills;
    const authAPI = {
        async loginToken(apiKey, secret) {
            return rev.post('/api/v2/authenticate', {
                apiKey,
                secret
            });
        },
        async extendSessionToken(apiKey) {
            return rev.post(`/api/v2/auth/extend-session-timeout/${apiKey}`);
        },
        async logoffToken(apiKey) {
            return rev.delete(`/api/v2/tokens/${apiKey}`);
        },
        async loginUser(username, password) {
            return rev.post('/api/v2/user/login', {
                username,
                password
            });
        },
        async logoffUser(userId) {
            return rev.post('/api/v2/user/logoff', { userId });
        },
        async extendSessionUser(userId) {
            return rev.post('/api/v2/user/extend-session-timeout', { userId });
        },
        async verifySession() {
            return rev.get('/api/v2/user/session');
        },
        /**
         * @deprecated - use logoffUser - put here because it's a common misspelling
         */
        get logoutUser() { return authAPI.logoffUser; },
        /**
         * @deprecated - use logoffToken - put here because it's a common misspelling
         */
        get logoutToken() { return authAPI.logoffToken; },
        /**
         *
         * @param config OAuth signing settings, retrieved from Rev Admin -> Security -> API Keys page
         * @param state optional state to pass back to redirectUri once complete
         * @returns A valid oauth flow URL
         */
        async buildOAuthAuthenticateURL(config, state = '1') {
            const RESPONSE_TYPE = 'code';
            const { oauthApiKey, oauthSecret, redirectUri } = config;
            const timestamp = new Date();
            if (isNaN(timestamp.getTime())) {
                throw new TypeError(`Invalid Timestamp ${timestamp}`);
            }
            const verifier = `${oauthApiKey}::${timestamp.toISOString()}`;
            const signature = await hmacSign(oauthSecret, verifier);
            const url = new URL('/oauth/authorization', rev.url);
            url.search = new URLSearchParams({
                'apiKey': oauthApiKey,
                'signature': signature,
                'verifier': verifier,
                'redirect_uri': redirectUri,
                'response_type': RESPONSE_TYPE,
                'state': state,
            }).toString();
            return `${url}`;
        },
        parseOAuthRedirectResponse(url) {
            const parsedUrl = typeof url === 'string'
                ? new URL(url)
                : url;
            const authCode = parsedUrl.searchParams.get('auth_code') || '';
            const state = parsedUrl.searchParams.get('state') || '';
            const error = parsedUrl.searchParams.get('error');
            return {
                isSuccess: !error,
                authCode,
                state,
                error
            };
        },
        async loginOAuth(config, authCode) {
            const GRANT_AUTH = 'authorization_code';
            const { oauthApiKey: apiKey, redirectUri } = config;
            // sometimes the authCode can get mangled, with the pluses in the code
            // being replaced by spaces. This is just to make sure that isn't a problem
            authCode = authCode.replace(/ /g, '+');
            // COMBAK I don't think it matters if rev-client is logged in and passing Authorization headers or not.
            return rev.post('/oauth/token', {
                authCode,
                apiKey,
                redirectUri,
                grandType: GRANT_AUTH
            });
        },
        async extendSessionOAuth(config, refreshToken) {
            const GRANT_REFRESH = 'refresh_token';
            const { oauthApiKey: apiKey, redirectUri } = config;
            return rev.post('/oauth/token', {
                apiKey,
                refreshToken,
                grantType: GRANT_REFRESH
            });
        }
    };
    return authAPI;
}

function categoryAPIFactory(rev) {
    const categoryAPI = {
        async create(category) {
            return rev.post('/api/v2/categories', category, { responseType: 'json' });
        },
        async details(categoryId) {
            return rev.get(`/api/v2/categories/${categoryId}`, undefined, { responseType: 'json' });
        },
        async update(categoryId, category) {
            return rev.put(`/api/v2/categories/${categoryId}`, category);
        },
        async delete(categoryId) {
            return rev.delete(`/api/v2/categories/${categoryId}`);
        },
        /**
         * get list of categories in system
         * @see {@link https://revdocs.vbrick.com/reference#getcategories}
         */
        async list(parentCategoryId, includeAllDescendants) {
            // only pass parameters if defined
            const payload = Object.assign({}, parentCategoryId && { parentCategoryId }, includeAllDescendants != undefined && { includeAllDescendants });
            const { categories } = await rev.get('/api/v2/categories', payload, { responseType: 'json' });
            return categories;
        }
    };
    return categoryAPI;
}

function deviceAPIFactory(rev) {
    const deviceAPI = {
        async dmes() {
            const response = await rev.get('/api/v2/devices/dmes');
            return response.devices;
        },
        async zoneDevices() {
            const response = await rev.get('/api/v2/zonedevices');
            return response.devices;
        },
        async presentationProfiles() {
            return rev.get('/api/v2/presentation-profiles');
        },
        async add(dme) {
            return rev.post('/api/v2/devices/dmes', dme);
        },
        async healthStatus(deviceId) {
            return rev.get(`/api/v2/devices/dmes/${deviceId}/health-status`);
        },
        async delete(deviceId) {
            return rev.delete(`/api/v2/devices/dmes/${deviceId}`);
        }
    };
    return deviceAPI;
}

async function decodeBody(response, acceptType) {
    const contentType = response.headers.get('Content-Type') || acceptType || '';
    if (contentType.startsWith('application/json')) {
        try {
            return await response.json();
        }
        catch (err) {
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
async function* searchScrollStream(rev, searchOptions, data, options) {
    const { endpoint, totalKey, hitsKey, isPost = false } = searchOptions;
    const { maxResults = Infinity, onPage = (items, index, total) => {
        rev.log('debug', `searching ${hitsKey}, ${index}-${index + items.length} of ${total}...`);
    } } = options;
    const query = { ...data };
    delete query.scrollId;
    let total = maxResults;
    let current = 0;
    // continue until max reached
    while (current < maxResults) {
        const response = await isPost
            ? rev.post(endpoint, query, { responseType: 'json' })
            : rev.get(endpoint, query, { responseType: 'json' });
        let { scrollId, [totalKey]: responseTotal, [hitsKey]: items } = response;
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

function groupAPIFactory(rev) {
    const groupAPI = {
        /**
         * Create a group. Returns the resulting Group ID
         * @param {{name: string, userIds: string[], roleIds: string[]}} group
         * @returns {Promise<string>}
         */
        async create(group) {
            const { groupId } = await rev.post('/api/v2/groups', group);
            return groupId;
        },
        async delete(groupId) {
            await rev.delete(`/api/v2/groups/${groupId}`);
        },
        /**
         *
         * @param {string} [searchText]
         * @param {Rev.SearchOptions<{Id: string, Name: string}>} [options]
         */
        async search(searchText, options = {}) {
            const searchDefinition = {
                endpoint: '/api/v2/search/access-entity',
                totalKey: 'totalEntities',
                hitsKey: 'accessEntities'
            };
            const query = { type: 'group' };
            if (searchText) {
                query.q = searchText;
            }
            const results = [];
            const pager = searchScrollStream(rev, searchDefinition, query, options);
            for await (const rawGroup of pager) {
                results.push(rawGroup);
            }
            return results;
        },
        async list(options = {}) {
            return groupAPI.search(undefined, options);
        },
        async listUsers(groupId, options = {}) {
            const searchDefinition = {
                endpoint: `/api/v2/search/groups/${groupId}/users`,
                totalKey: 'totalUsers',
                hitsKey: 'userIds'
            };
            const userIds = [];
            const pager = searchScrollStream(rev, searchDefinition, undefined, options);
            for await (const id of pager) {
                userIds.push(id);
            }
            return userIds;
        },
        /**
         * get all users in a group with full details as a async generator
         * @param groupId
         * @param options
         * @returns
         */
        async *usersDetailStream(groupId, options = {}) {
            const { onError = (userId, error) => rev.log('warn', `Error getting user details for ${userId}`, error), ...searchOptions } = options;
            const searchDefinition = {
                endpoint: `/api/v2/search/groups/${groupId}/users`,
                totalKey: 'totalUsers',
                hitsKey: 'userIds'
            };
            const pager = searchScrollStream(rev, searchDefinition, undefined, searchOptions);
            for await (const userId of pager) {
                try {
                    const user = await rev.user.details(userId);
                    yield user;
                }
                catch (error) {
                    onError(userId, error);
                }
            }
        }
    };
    return groupAPI;
}

function playlistAPIFactory(rev) {
    const playlistAPI = {
        async create(name, videoIds) {
            const payload = {
                name,
                videoIds
            };
            const { playlistId } = await rev.post('/api/v2/playlists', payload, { responseType: 'json' });
            return playlistId;
        },
        async update(playlistId, actions) {
            const payload = {
                playlistVideoDetails: actions
            };
            return rev.put(`/api/v2/playlists/${playlistId}`, payload);
        },
        async updateFeatured(actions) {
            const payload = {
                playlistVideoDetails: actions
            };
            return rev.put(`/api/v2/playlists/featured-playlist`, payload);
        },
        async delete(playlistId) {
            return rev.delete(`/api/v2/playlists/${playlistId}`);
        },
        /**
         * get list of playlists in system.
         * NOTE: return type is slightly different than API documentation
         * @see {@link https://revdocs.vbrick.com/reference#getplaylists}
         */
        async list() {
            // ensure raw response is in consistent format
            function parsePlaylist(entry) {
                return {
                    id: entry.id ?? entry.playlistId ?? entry.featurePlaylistId ?? entry.featuredPlaylist,
                    name: entry.name ?? entry.playlistName,
                    playbackUrl: entry.playbackUrl,
                    videos: entry.videos ?? entry.Videos
                };
            }
            const rawResult = await rev.get('/api/v2/playlists', { responseType: 'json' });
            // rawResult may return in strange format, so cleanup and return consistent output
            const hasFeatured = !Array.isArray(rawResult);
            const rawPlaylists = hasFeatured
                ? rawResult.playlists
                : rawResult;
            const output = {
                playlists: rawPlaylists.map(parsePlaylist)
            };
            if (hasFeatured) {
                if (isPlainObject(rawResult.featuredPlaylist)) {
                    output.featuredPlaylist = parsePlaylist(rawResult.featuredPlaylist);
                }
                else if (Array.isArray(rawResult.videos)) {
                    output.featuredPlaylist = parsePlaylist(rawResult);
                }
            }
            return output;
        }
    };
    return playlistAPI;
}

function recordingAPIFactory(rev) {
    const recordingAPI = {
        async startVideoConferenceRecording(sipAddress, sipPin, title) {
            const { videoId } = await rev.post('/api/v2/vc/start-recording', { title, sipAddress, sipPin }, { responseType: 'json' });
            return videoId;
        },
        async getVideoConferenceStatus(videoId) {
            const { status } = await rev.get(`/api/v2/vc/recording-status/${videoId}`, undefined, { responseType: 'json' });
            return status;
        },
        async stopVideoConferenceRecording(videoId) {
            const payload = { videoId };
            const result = await rev.post(`/api/v2/vc/stop-recording`, payload, { responseType: 'json' });
            return isPlainObject(result)
                ? result.message
                : result;
        },
        async startPresentationProfileRecording(request) {
            const { scheduledRecordingId } = await rev.post('/api/v2/pp/start-recording', request, { responseType: 'json' });
            return scheduledRecordingId;
        },
        async getPresentationProfileStatus(recordingId) {
            const result = await rev.get(`/api/v2/pp/recording-status/${recordingId}`, undefined, { responseType: 'json' });
            return result;
        },
        async stopPresentationProfileRecording(recordingId) {
            const payload = { scheduledRecordingId: recordingId };
            const result = await rev.get(`/api/v2/vc/recording-status`, payload, { responseType: 'json' });
            return result;
        }
    };
    return recordingAPI;
}

const mimeTypes = {
    '.7z': 'application/x-7z-compressed',
    '.asf': 'video/x-ms-asf',
    '.avi': 'video/x-msvideo',
    '.csv': 'text/csv',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.f4v': 'video/x-f4v',
    '.flv': 'video/x-flv',
    '.gif': 'image/gif',
    '.jpg': 'image/jpeg',
    '.m4a': 'audio/mp4',
    '.m4v': 'video/x-m4v',
    '.mkv': 'video/x-matroska',
    '.mov': 'video/quicktime',
    '.mp3': 'audio/mpeg',
    '.mp4': 'video/mp4',
    '.mpg': 'video/mpeg',
    '.pdf': 'application/pdf',
    '.png': 'image/png',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.rar': 'application/x-rar-compressed',
    '.srt': 'application/x-subrip',
    '.svg': 'image/svg+xml',
    '.swf': 'application/x-shockwave-flash',
    '.ts': 'video/mp2t',
    '.txt': 'text/plain',
    '.wmv': 'video/x-ms-wmv',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.zip': 'application/zip',
    '.mks': 'video/x-matroska',
    '.mts': 'model/vnd.mts',
    '.wma': 'audio/x-ms-wma'
};
function getMimeForExtension(extension = '', defaultType = 'video/mp4') {
    extension = extension.toLowerCase();
    if (extension && (extension in mimeTypes)) {
        return mimeTypes[extension];
    }
    return defaultType;
}
function getExtensionForMime(contentType, defaultExtension = '.mp4') {
    const match = contentType && Object.entries(mimeTypes)
        .find(([ext, mime]) => contentType.startsWith((mime)));
    return match
        ? match[0]
        : defaultExtension;
}
function sanitizeFileUpload(payload) {
    let { file, options: { filename = 'upload', contentType = '' } } = payload;
    // sanitize content type
    if (contentType === 'application/octet-stream') {
        contentType = '';
    }
    if (/charset/.test(contentType)) {
        contentType = contentType.replace(/;?.*charset.*$/, '');
    }
    let name = filename.replace('\.[^\.]+$', '');
    let ext = filename.replace(name, '');
    if (!ext) {
        ext = getExtensionForMime(contentType);
    }
    filename = `${name}${ext}`;
    if (!contentType) {
        contentType = getMimeForExtension(ext);
    }
    if (isBlobLike(file) && file.type !== contentType) {
        payload.file = file.slice(0, file.size, contentType);
    }
    Object.assign(payload.options, {
        filename,
        contentType
    });
    return payload;
}
function appendJSONToForm(form, fieldName, data) {
    form.append(fieldName, JSON.stringify(data));
}
/**
 * This method is included for isometric support of uploading files in node.js and browser.
 * @param form FormData instance
 * @param fieldName name of field to add to form
 * @param file the file. Can be Blob or File on browser. On node.js it can be anything the 'form-data' package will accept
 * @param options optional filename, contentType and contentLength of upload. Otherwise it will try to guess based on input
 */
async function appendFileToForm$1(form, fieldName, file, options = {}) {
    const opts = {
        filename: 'upload',
        contentType: '',
        ...options
    };
    let payload = await polyfills.parseFileUpload(file, opts);
    payload = sanitizeFileUpload(payload);
    await polyfills.appendFileToForm(form, fieldName, payload);
    return payload.options;
}
async function prepareFileUploadHeaders(form, headers, useChunkedTransfer) {
    await polyfills.prepareUploadHeaders(form, headers, useChunkedTransfer);
}
/**
 * helper to upload multipart forms with files attached.
 * This is to work around issues with node.js's FormData implementation
 * @param rev Rev Client
 * @param method
 * @param endpoint
 * @param form
 * @param useChunkedTransfer
 * @param options
 * @returns
 */
async function uploadMultipart(rev, method, endpoint, form, useChunkedTransfer = false, options = {}) {
    const { headers: optHeaders } = options;
    useChunkedTransfer = typeof useChunkedTransfer === 'boolean'
        ? useChunkedTransfer
        : useChunkedTransfer.useChunkedTransfer;
    // coerce to Headers object, may be undefined
    const headers = new polyfills.Headers(optHeaders);
    // switches to transfer encoding upload if necessary
    await prepareFileUploadHeaders(form, headers, useChunkedTransfer);
    options.headers = headers;
    const { body } = await rev.request(method, endpoint, form, options);
    return body;
}

function uploadAPIFactory(rev) {
    const { FormData } = polyfills;
    const uploadAPI = {
        /**
         * Upload a video, and returns the resulting video ID
         */
        async video(file, metadata = { uploader: rev.session.username }, options = {}) {
            // prepare payload
            const form = new FormData();
            // at bare minimum the uploader needs to be defined
            if (!metadata.uploader) {
                // if using username login then uploader can be set to current user
                const defaultUsername = rev.session.username;
                if (defaultUsername) {
                    metadata.uploader = defaultUsername;
                }
                else {
                    throw new TypeError('metadata must include uploader parameter');
                }
            }
            // add video metadata to body (as json)
            appendJSONToForm(form, 'video', metadata);
            // append file (works around some node's form-data library quirks)
            const filePayload = await appendFileToForm$1(form, 'VideoFile', file, options);
            rev.log('info', `Uploading ${filePayload.filename} (${filePayload.contentType})`);
            const { videoId } = await uploadMultipart(rev, 'POST', '/api/v2/uploads/videos', form, filePayload);
            return videoId;
        },
        async transcription(videoId, file, language = 'en', options = {}) {
            // validate language
            // TODO put this in a constants file somewhere
            const supportedLanguages = ['de', 'en', 'en-gb', 'es-es', 'es-419', 'es', 'fr', 'fr-ca', 'id', 'it', 'ko', 'ja', 'nl', 'no', 'pl', 'pt', 'pt-br', 'th', 'tr', 'fi', 'sv', 'ru', 'el', 'zh', 'zh-tw', 'zh-cmn-hans'];
            let lang = language.toLowerCase();
            if (!supportedLanguages.includes(lang)) {
                // try removing trailing language specifier
                lang = lang.slice(2);
                if (!supportedLanguages.includes(lang)) {
                    throw new TypeError(`Invalid language ${language} - supported values are ${supportedLanguages.join(', ')}`);
                }
            }
            const form = new FormData();
            const filePayload = await appendFileToForm$1(form, 'File', file, options);
            const metadata = {
                files: [
                    { language: lang, fileName: filePayload.filename }
                ]
            };
            appendJSONToForm(form, 'TranscriptionFiles', metadata);
            rev.log('info', `Uploading transcription to ${videoId} (${lang} ${filePayload.filename} (${filePayload.contentType})`);
            await uploadMultipart(rev, 'POST', `/api/v2/transcription-files/${videoId}`, form, filePayload);
        }
    };
    return uploadAPI;
}

function userAPIFactory(rev) {
    const userAPI = {
        /**
         * get the list of roles available in the system (with role name and id)
         */
        get roles() {
            return rev.admin.roles;
        },
        /**
         * Create a new User in Rev
         * @param user
         * @returns the User ID of the created user
         */
        async create(user) {
            const { userId } = await rev.post('/api/v2/users', user);
            return userId;
        },
        async details(userId) {
            return rev.get(`/api/v2/users/${userId}`);
        },
        /**
         */
        async getByUsername(username) {
            return rev.get(`/api/v2/users/${username}`, { type: 'username' });
        },
        /**
         */
        async getByEmail(email) {
            return rev.get(`/api/v2/users/${email}`, { type: 'email' });
        },
        /**
         * use PATCH API to add user to the specified group
         * https://revdocs.vbrick.com/reference#edituserdetails
         * @param {string} userId id of user in question
         * @param {string} groupId
         * @returns {Promise<void>}
         */
        async addToGroup(userId, groupId) {
            const operations = [
                { op: 'add', path: '/GroupIds/-', value: groupId }
            ];
            await rev.patch(`/api/v2/users/${userId}`, operations);
        },
        /**
         * use PATCH API to add user to the specified group
         * https://revdocs.vbrick.com/reference#edituserdetails
         * @param {string} userId id of user in question
         * @param {string} groupId
         * @returns {Promise<void>}
         */
        async removeFromGroup(userId, groupId) {
            const operations = [
                { op: 'remove', path: '/GroupIds', value: groupId }
            ];
            await rev.patch(`/api/v2/users/${userId}`, operations);
        },
        /**
         * search for users based on text query. Leave blank to return all users.
         *
         * @param {string} [searchText]
         * @param {Rev.SearchOptions<{Id: string, Name: string}>} [options]
         */
        async search(searchText, options = {}) {
            const searchDefinition = {
                endpoint: '/api/v2/search/access-entity',
                totalKey: 'totalEntities',
                hitsKey: 'accessEntities'
            };
            const query = { type: 'user' };
            if (searchText) {
                query.q = searchText;
            }
            const results = [];
            const pager = searchScrollStream(rev, searchDefinition, query, options);
            for await (const user of pager) {
                results.push(user);
            }
            return results;
        }
    };
    return userAPI;
}

function videoAPIFactory(rev) {
    const videoAPI = {
        /**
         * This is an example of using the video Patch API to only update a single field
         * @param videoId
         * @param title
         */
        async setTitle(videoId, title) {
            const payload = [{ op: 'add', path: '/Title', value: title }];
            await rev.patch(`/api/v2/videos/${videoId}`, payload);
        },
        /**
         * get processing status of a video
         * @param videoId
         */
        async status(videoId) {
            return rev.get(`/api/v2/videos/${videoId}/status`);
        },
        async details(videoId) {
            return rev.get(`/api/v2/videos/${videoId}/details`);
        },
        get upload() {
            return rev.upload.video;
        },
        /**
         * search for videos. leave blank to get all videos in the account
         */
        async search(query = {}, options = {}) {
            const searchDefinition = {
                endpoint: '/api/v2/videos/search',
                totalKey: 'totalVideos',
                hitsKey: 'videos'
            };
            const results = [];
            const pager = searchScrollStream(rev, searchDefinition, query, options);
            for await (const video of pager) {
                results.push(video);
            }
            return results;
        },
        /**
         * Example of using the video search API to search for videos, then getting
         * the details of each video
         * @param query
         * @param options
         */
        async *searchDetailed(query = {}, options = {}) {
            const searchDefinition = {
                endpoint: '/api/v2/videos/search',
                totalKey: 'totalVideos',
                hitsKey: 'videos'
            };
            const pager = searchScrollStream(rev, searchDefinition, query, options);
            for await (const rawVideo of pager) {
                const out = rawVideo;
                try {
                    const details = await videoAPI.details(rawVideo.id);
                    Object.assign(out, details);
                }
                catch (error) {
                    out.error = error;
                }
                yield out;
            }
        },
        async playbackInfo(videoId) {
            const { video } = await rev.get(`/api/v2/videos/${videoId}/playback-url`);
            return video;
        },
        async download(videoId) {
            const response = await rev.request('GET', `/api/v2/videos/${videoId}/download`, undefined, {
                responseType: 'stream'
            });
            return response;
        },
        async downloadTranscription(videoId, language) {
            const { body } = await rev.request('GET', `/api/v2/videos/${videoId}/transcription-files/${language}`, undefined, { responseType: 'blob' });
            return body;
        },
        async downloadThumbnail(query) {
            const { videoId = '', imageId = '' } = typeof query === 'string'
                ? { imageId: query }
                : query;
            if (!(videoId || imageId)) {
                throw new TypeError('No video/image specified to download');
            }
            let thumbnailUrl = imageId
                ? `/api/v2/media/videos/thumbnails/${imageId}.jpg`
                // allow getting from api if only know the video ID
                : (await videoAPI.playbackInfo(videoId)).thumbnailUrl;
            const { body } = await rev.request('GET', thumbnailUrl, undefined, { responseType: 'blob' });
            return body;
        }
    };
    return videoAPI;
}

function webcastAPIFactory(rev) {
    const webcastAPI = {
        async list(options = {}) {
            return rev.get('/api/v2/scheduled-events', options, { responseType: 'json' });
        },
        async search(query, options) {
            const results = [];
            const pager = webcastAPI.searchStream(query, options);
            for await (const session of pager) {
                results.push(session);
            }
            return results;
        },
        *searchStream(query, options) {
            const searchDefinition = {
                endpoint: `/api/v2/search/scheduled-events`,
                totalKey: 'total',
                hitsKey: 'events',
                isPost: true
            };
            return searchScrollStream(rev, searchDefinition, query, options);
        },
        async create(event) {
            const { eventId } = await rev.post(`/api/v2/scheduled-events`, event);
            return eventId;
        },
        async details(eventId) {
            return rev.get(`/api/v2/scheduled-events/${eventId}`);
        },
        async edit(eventId, event) {
            return rev.put(`/api/v2/scheduled-events/${eventId}`, event);
        },
        // async patch - not yet implemented
        async delete(eventId) {
            return rev.delete(`/api/v2/scheduled-events/${eventId}`);
        },
        async editAccess(eventId, entities) {
            return rev.put(`/api/v2/scheduled-events/${eventId}/access-control`, entities);
        },
        async attendees(eventId, runNumber, options) {
            const searchDefinition = {
                endpoint: `/api/v2/scheduled-events/${eventId}/post-event-report`,
                totalKey: 'totalSessions',
                hitsKey: 'sessions'
            };
            const query = runNumber >= 0 ? { runNumber } : {};
            const results = [];
            const pager = searchScrollStream(rev, searchDefinition, query, options);
            for await (const session of pager) {
                results.push(session);
            }
            return results;
        },
        async questions(eventId, runNumber) {
            const query = runNumber >= 0 ? { runNumber } : {};
            return rev.get(`/api/v2/scheduled-events/${eventId}/questions`, query, { responseType: 'json' });
        },
        async pollResults(eventId, runNumber) {
            const query = runNumber >= 0 ? { runNumber } : {};
            return rev.get(`/api/v2/scheduled-events/${eventId}/poll-results`, query, { responseType: 'json' });
        },
        async comments(eventId, runNumber) {
            const query = runNumber >= 0 ? { runNumber } : {};
            return rev.get(`/api/v2/scheduled-events/${eventId}/comments`, query, { responseType: 'json' });
        },
        async status(eventId) {
            return rev.get(`/api/v2/scheduled-events/${eventId}/status`);
        },
        async playbackUrl(eventId, options = {}) {
            const { ip, userAgent } = options;
            const query = ip ? { ip } : undefined;
            const requestOptions = {
                responseType: 'json'
            };
            if (userAgent) {
                requestOptions.headers = { 'User-Agent': userAgent };
            }
            return rev.get(`/api/v2/scheduled-events/${eventId}/playback-url`, query, requestOptions);
        },
        async startEvent(eventId, preProduction = false) {
            await rev.put(`/api/v2/scheduled-events/${eventId}/start`, { preProduction });
        },
        async stopEvent(eventId, preProduction = false) {
            await rev.delete(`/api/v2/scheduled-events/${eventId}/start`, { preProduction });
        },
        async startBroadcast(eventId) {
            await rev.put(`/api/v2/scheduled-events/${eventId}/broadcast`);
        },
        async stopBroadcast(eventId) {
            await rev.delete(`/api/v2/scheduled-events/${eventId}/broadcast`);
        },
        async startRecord(eventId) {
            await rev.put(`/api/v2/scheduled-events/${eventId}/record`);
        },
        async stopRecord(eventId) {
            await rev.delete(`/api/v2/scheduled-events/${eventId}/record`);
        },
        async linkVideo(eventId, videoId, autoRedirect = true) {
            const payload = {
                videoId,
                redirectVod: autoRedirect
            };
            return rev.put(`/api/v2/scheduled-events/${eventId}/linked-video`, payload);
        },
        async unlinkVideo(eventId) {
            return rev.delete(`/api/v2/scheduled-events/${eventId}/linked-video`);
        }
    };
    return webcastAPI;
}

function zonesAPIFactory(rev) {
    const zonesAPI = {
        async list() {
            return rev.get(`/api/v2/zones`, undefined, { responseType: 'json' });
        },
        async flatList() {
            const { defaultZone, zones } = await zonesAPI.list();
            const flatZones = [defaultZone];
            function recursiveAdd(inZone) {
                const { childZones = [], ...zone } = inZone;
                flatZones.push(zone);
                childZones.forEach(recursiveAdd);
            }
            zones.forEach(recursiveAdd);
            return flatZones;
        },
        async create(zone) {
            const { zoneId } = await rev.post(`/api/v2/zones`, zone, { responseType: 'json' });
            return zoneId;
        },
        async edit(zoneId, zone) {
            return rev.put(`/api/v2/zones/${zoneId}`, zone);
        },
        delete(zoneId) {
            return rev.delete(`/api/v2/zones/${zoneId}`);
        },
        get devices() {
            return rev.device.zoneDevices;
        }
    };
    return zonesAPI;
}

const ONE_MINUTE = 1000 * 60;
// obsfucate credentials to avoid accidental disclosure
const _credentials = Symbol('credentials');
class SessionKeepAlive {
    constructor(session, options = {}) {
        this._isExtending = false;
        // TODO verify values?
        this.extendOptions = {
            extendThresholdMilliseconds: 3 * ONE_MINUTE,
            keepAliveInterval: 5 * ONE_MINUTE,
            verify: true,
            ...options
        };
        Object.defineProperties(this, {
            _session: {
                get: () => session,
                enumerable: false
            }
        });
    }
    getNextExtendTime() {
        const { expires } = this._session;
        if (!expires) {
            return;
        }
        const { keepAliveInterval: interval, extendThresholdMilliseconds: threshold } = this.extendOptions;
        const timeTillExpiration = expires.getTime() - Date.now();
        // clamp range to within 0 and max interval
        return Math.max(0, Math.min(timeTillExpiration - threshold, interval));
    }
    async _poll() {
        const { _session: session } = this;
        // force stop other poll process if already polling
        // keep reference to controller in case of reset
        const controller = this._reset();
        const { signal } = controller;
        while (session.isConnected && !signal.aborted) {
            const nextExtendTime = this.getNextExtendTime();
            await sleep(nextExtendTime, signal);
            // check if poll was aborted. if so don't try to extend
            if (signal.aborted) {
                break;
            }
            // extend session
            // possible this can throw an error
            try {
                // extending may re-login, so pause poll resets for now
                this._isExtending = true;
                await session.lazyExtend(this.extendOptions);
            }
            catch (err) {
                // swallow error, but signal stopped using abort controller
                controller.abort();
                this.error = err;
            }
            finally {
                this._isExtending = false;
            }
        }
    }
    start() {
        if (this._isExtending) {
            return;
        }
        this._poll();
    }
    stop() {
        if (this._isExtending) {
            return;
        }
        if (this.controller) {
            this.controller.abort();
        }
    }
    _reset() {
        this.error = undefined;
        this._isExtending = false;
        const oldController = this.controller;
        this.controller = new polyfills.AbortController();
        // stop previous poll
        if (oldController) {
            oldController.abort();
        }
        return this.controller;
    }
    get isAlive() {
        return this.controller && !this.controller.signal.aborted;
    }
}
class SessionBase {
    constructor(rev, credentials, keepAliveOptions) {
        this.expires = new Date();
        if (keepAliveOptions === true) {
            this.keepAlive = new SessionKeepAlive(this);
        }
        else if (isPlainObject(keepAliveOptions)) {
            this.keepAlive = new SessionKeepAlive(this, keepAliveOptions);
        }
        // add as private member
        Object.defineProperties(this, {
            rev: {
                get() { return rev; },
                enumerable: false
            },
            [_credentials]: {
                get() { return credentials; },
                enumerable: false
            }
        });
    }
    async login() {
        this.token = undefined;
        this.expires = new Date();
        const { expiration, ...session } = await this._login();
        Object.assign(this, session);
        this.expires = new Date(expiration);
        if (this.keepAlive) {
            this.keepAlive.start();
        }
    }
    async extend() {
        const { expiration } = await this._extend();
        this.expires = new Date(expiration);
    }
    async logoff() {
        if (this.keepAlive) {
            this.keepAlive.stop();
        }
        try {
            await this._logoff();
        }
        finally {
            this.token = undefined;
            this.expires = new Date();
        }
    }
    async verify() {
        try {
            await this.rev.auth.verifySession();
            return true;
        }
        catch (err) {
            return false;
        }
    }
    /**
     *
     * @returns wasExtended - whether session was extended / re-logged in
     */
    async lazyExtend(options = {}) {
        const { extendThresholdMilliseconds: threshold = 3 * ONE_MINUTE, verify: shouldVerify = true } = options;
        const { expires } = this;
        const timeLeft = expires
            ? expires.getTime() - Date.now()
            : -1;
        // login if session expired
        if (timeLeft <= 0) {
            await this.login();
            return true;
        }
        // extend if within extend window
        if (timeLeft > threshold) {
            try {
                await this.extend();
                // successful extend, nothing more to do
                return true;
            }
            catch (error) {
                this.rev.log('warn', 'Error extending session - re-logging in', error);
            }
            // check if valid session if plenty of time left
        }
        else if (!shouldVerify || await this.verify()) {
            // valid, no change
            return false;
        }
        // if reached here then need to re-login
        await this.login();
        return true;
    }
    /**
     * check if expiration time of session has passed
     */
    get isExpired() {
        const { expires } = this;
        if (!expires) {
            return true;
        }
        return Date.now() > expires.getTime();
    }
    /**
     * returns true if session isn't expired and has a token
     */
    get isConnected() {
        return this.token && !this.isExpired;
    }
    get username() {
        return this[_credentials].username;
    }
}
class OAuthSession extends SessionBase {
    async _login() {
        const { oauthConfig, authCode } = this[_credentials];
        const { accessToken: token, expiration, refreshToken, userId } = await this.rev.auth.loginOAuth(oauthConfig, authCode);
        return { token, expiration, refreshToken, userId };
    }
    async _extend() {
        const { [_credentials]: { oauthConfig } } = this;
        const { 
        // other API calls call this "token" instead of "accessToken", hence the rename
        accessToken: token, expiration, refreshToken } = await this.rev.auth.extendSessionOAuth(oauthConfig, this.refreshToken);
        // unlike other extend methods this updates the token + refreshToken each time
        Object.assign(this, { token, refreshToken });
        return { expiration };
    }
    async _logoff() {
        // nothing to do
        return;
    }
}
class UserSession extends SessionBase {
    async _login() {
        const { username, password } = this[_credentials];
        const { token, expiration, id: userId } = await this.rev.auth.loginUser(username, password);
        return { token, expiration, userId };
    }
    async _extend() {
        const { userId } = this;
        return this.rev.auth.extendSessionUser(userId);
    }
    async _logoff() {
        const { userId } = this;
        return this.rev.auth.logoffUser(userId);
    }
}
class ApiKeySession extends SessionBase {
    async _login() {
        const { apiKey, secret } = this[_credentials];
        return this.rev.auth.loginToken(apiKey, secret);
    }
    async _extend() {
        const { apiKey } = this[_credentials];
        return this.rev.auth.extendSessionToken(apiKey);
    }
    async _logoff() {
        const { apiKey } = this[_credentials];
        return this.rev.auth.logoffToken(apiKey);
    }
}
function createSession(rev, credentials, keepAliveOptions) {
    const isOauthLogin = credentials.authCode && credentials.oauthConfig;
    const isUsernameLogin = credentials.username && credentials.password;
    const isTokenLogin = credentials.apiKey && credentials.secret;
    if (isOauthLogin) {
        return new OAuthSession(rev, credentials, keepAliveOptions);
    }
    if (isTokenLogin) {
        return new ApiKeySession(rev, credentials, keepAliveOptions);
    }
    if (isUsernameLogin) {
        return new UserSession(rev, credentials, keepAliveOptions);
    }
    throw new TypeError('Must specify credentials (username+password, apiKey+secret or oauthConfig+authCode)');
}

class RevClient {
    constructor(options) {
        if (!isPlainObject(options) || !options.url) {
            throw new TypeError('Missing configuration options for client - url and username/password or apiKey/secret');
        }
        const { url, log, logEnabled = false, keepAlive = true, ...credentials } = options;
        // get just the origin of provided url
        const urlObj = new URL(url);
        this.url = urlObj.origin;
        // will throw error if credentials are invalid
        this.session = createSession(this, credentials, keepAlive);
        // add logging functionality
        this.logEnabled = !!logEnabled;
        if (log) {
            this.log = (severity, ...args) => {
                if (!this.logEnabled) {
                    return;
                }
                log(severity, ...args);
            };
        }
        // add all API endpoints
        Object.defineProperties(this, {
            admin: { value: adminAPIFactory(this), writable: false },
            audit: { value: auditAPIFactory(this), writable: false },
            auth: { value: authAPIFactory(this), writable: false },
            category: { value: categoryAPIFactory(this), writable: false },
            device: { value: deviceAPIFactory(this), writable: false },
            group: { value: groupAPIFactory(this), writable: false },
            playlist: { value: playlistAPIFactory(this), writable: false },
            recording: { value: recordingAPIFactory(this), writable: false },
            upload: { value: uploadAPIFactory(this), writable: false },
            user: { value: userAPIFactory(this), writable: false },
            video: { value: videoAPIFactory(this), writable: false },
            webcasts: { value: webcastAPIFactory(this), writable: false },
            zones: { value: zonesAPIFactory(this), writable: false }
        });
    }
    /**
     * make a REST request
     */
    async request(method, endpoint, data = undefined, options = {}) {
        const url = new URL(endpoint, this.url);
        // ensure url matches Rev url, to avoid sending authorization header elsewhere
        if (url.origin !== this.url) {
            throw new TypeError(`Invalid endpoint - must be relative to ${this.url}`);
        }
        const { headers: optHeaders, responseType, ...requestOpts } = options;
        // setup headers for JSON communication (by default)
        const headers = new polyfills.Headers(optHeaders);
        // add authorization header from stored token
        if (this.session.token && !headers.has('Authorization')) {
            headers.set('Authorization', `VBrick ${this.session.token}`);
        }
        if (headers.get('Authorization') === '') {
            // if Auth is explicitly set to '' then remove from list
            headers.delete('Authorization');
        }
        const fetchOptions = {
            mode: 'cors',
            method,
            ...requestOpts,
            headers
        };
        // default to JSON request payload, but allow it to be overridden
        let shouldSetAsJSON = !headers.has('Content-Type');
        // add provided data to request body or as query string parameters
        if (data) {
            if (['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
                if (typeof data === 'string') {
                    fetchOptions.body = data;
                }
                else if (data instanceof polyfills.FormData) {
                    shouldSetAsJSON = false;
                    fetchOptions.body = data;
                }
                else if (isPlainObject(data) || Array.isArray(data)) {
                    fetchOptions.body = JSON.stringify(data);
                }
                else {
                    fetchOptions.body = data;
                }
            }
            else if (isPlainObject(data)) {
                // add values to query string of URL
                for (let [key, value] of Object.entries(data)) {
                    url.searchParams.append(key, value);
                }
            }
            else {
                throw new TypeError(`Invalid payload for request to ${method} ${endpoint}`);
            }
        }
        // default to JSON communication
        if (!headers.has('Accept')) {
            headers.set('Accept', 'application/json');
        }
        // set to JSON payload
        if (shouldSetAsJSON) {
            headers.set('Content-Type', 'application/json');
        }
        // OPTIONAL log request and response
        this.log('debug', `Request ${method} ${endpoint}`);
        // NOTE: will throw error on AbortError or client fetch errors
        const response = await polyfills.fetch(`${url}`, {
            ...fetchOptions,
            method,
            headers
        });
        const { ok, status: statusCode, statusText, headers: responseHeaders } = response;
        this.log('debug', `Response ${method} ${endpoint} ${statusCode} ${statusText}`);
        // check for error response code
        if (!ok) {
            const err = await RevError.create(response);
            throw err;
        }
        let body = response.body;
        switch (responseType) {
            case 'json':
                body = await response.json();
                break;
            case 'text':
                body = await response.text();
                break;
            case 'blob':
                body = await response.blob();
                break;
            case 'stream':
                body = response.body;
                break;
            default:
                // if no mimetype in response then assume JSON unless otherwise specified
                body = await decodeBody(response, headers.get('Accept'));
        }
        return {
            statusCode,
            headers: responseHeaders,
            body,
            response
        };
    }
    async get(endpoint, data, options) {
        const { body } = await this.request('GET', endpoint, data, options);
        return body;
    }
    async post(endpoint, data, options) {
        const { body } = await this.request('POST', endpoint, data, options);
        return body;
    }
    async put(endpoint, data, options) {
        const { body } = await this.request('PUT', endpoint, data, options);
        return body;
    }
    async patch(endpoint, data, options) {
        await this.request('PATCH', endpoint, data, options);
    }
    async delete(endpoint, data, options) {
        await this.request('DELETE', endpoint, data, options);
    }
    /**
     * authenticate with Rev
     */
    async connect() {
        // Rarely the login call will fail on first attempt, therefore this code attempts to login
        // multiple times
        await retry(() => this.session.login(), 
        // Do not re-attempt logins with invalid user/password or rate limiting - it can lock out the user
        (err) => ![401, 429].includes(err.status));
    }
    /**
     * end rev session
     */
    async disconnect() {
        try {
            await this.session.logoff();
        }
        catch (error) {
            this.log('warn', `Error in logoff, ignoring: ${error}`);
        }
    }
    // this should get called every 15 minutes or so to extend the connection session
    async extendSession() {
        return this.session.extend();
    }
    /**
     * Returns true/false based on if the session is currently valid
     * @returns Promise<boolean>
     */
    async verifySession() {
        return this.session.verify();
    }
    get isConnected() {
        return this.session.token && !this.session.isExpired;
    }
    get token() {
        return this.session.token;
    }
    get sessionExpires() {
        return this.session.expires;
    }
    log(severity, ...args) {
        if (!this.logEnabled) {
            return;
        }
        const ts = (new Date()).toJSON().replace('T', ' ').slice(0, -5);
        console.debug(`${ts} REV-CLIENT [${severity}]`, ...args);
    }
}

async function getLengthFromStream(source) {
    const { length, contentLength, headers = {}, path: filepath } = source;
    if (isFinite(length)) {
        return length;
    }
    if (isFinite(contentLength)) {
        return contentLength;
    }
    // a HTTP Response object
    if (headers?.['content-length']) {
        const headerLength = parseInt(headers['content-length'], 10);
        if (isFinite(headerLength)) {
            return headerLength;
        }
    }
    // try to get size from a fs stream's path parameter
    if (filepath) {
        // sanity check 15 sec timeout
        const TIMEOUT_MS = 15 * 1000;
        let timer;
        const timeout = new Promise(done => { timer = setTimeout(done, TIMEOUT_MS, {}); });
        try {
            const stat = await Promise.race([fs__default['default'].promises.stat(filepath), timeout]);
            if (stat?.size) {
                return stat.size;
            }
        }
        catch (err) {
            // ignore
        }
        finally {
            clearTimeout(timer);
        }
    }
}
/**
 * For node.js support this allows uploading videos based on filename or from a readable stream
 */
async function parseFileUpload(file, options) {
    let { filename, contentType, contentLength, useChunkedTransfer } = options;
    // only try to get length if not already specified, or useChunkedTransfer is set
    const shouldUpdateLength = !(contentLength || useChunkedTransfer);
    if (typeof file === 'string') {
        if (!filename) {
            filename = path__default['default'].basename(file);
        }
        file = fs__default['default'].createReadStream(file);
        // get stats from disk
        if (shouldUpdateLength) {
            contentLength = await getLengthFromStream(file);
        }
    }
    else if (isBlobLike(file)) {
        const { type, name, size } = file;
        if (type && !contentType) {
            contentType = type;
        }
        if (name && !filename) {
            filename = name;
        }
        if (shouldUpdateLength) {
            contentLength = size;
        }
    }
    else if (isReadable(file)) {
        if (!filename) {
            const { path: _path, filename: _filename, name: _name } = file;
            // try to get filename from stream
            const streamPath = _path || _filename || _name;
            if (streamPath && typeof streamPath === 'string') {
                filename = path__default['default'].basename(streamPath);
            }
        }
        // try to get length from stream
        if (shouldUpdateLength) {
            contentLength = await getLengthFromStream(file);
        }
    }
    return {
        file,
        options: {
            ...options,
            filename,
            contentType,
            contentLength
        }
    };
}
async function appendFileToForm(form, fieldName, payload) {
    const { file, options: { filename, contentType, contentLength } } = payload;
    const appendOptions = { filename, contentType };
    if (contentLength) {
        appendOptions.knownLength = contentLength;
    }
    form.append(fieldName, file, appendOptions);
}
async function prepareUploadHeaders(form, headers, useChunkedTransfer = false) {
    const totalBytes = useChunkedTransfer
        ? 0
        : await util.promisify(form.getLength).call(form).catch(() => 0);
    if (totalBytes > 0) {
        headers.set('content-length', `${totalBytes}`);
    }
    else {
        headers.set('transfer-encoding', 'chunked');
        headers.delete('content-length');
        // HACK - node-fetch force attempts to get length from form-data. This is to keep it from setting the content-length header
        // form.getLengthSync = () => null;
    }
}
async function hmacSign(message, secret) {
    const hmac = crypto$1.createHmac('sha256', secret);
    const signature = hmac.update(message).digest('base64');
    return signature;
}
Object.assign(polyfills, {
    AbortController: nodeAbortController.AbortController,
    AbortSignal: nodeAbortController.AbortSignal,
    fetch: (...args) => fetch__default['default'](...args),
    FormData: FormData__default['default'],
    Headers: fetch.Headers,
    Request: fetch.Request,
    Response: fetch.Response,
    hmacSign,
    appendFileToForm,
    parseFileUpload,
    prepareUploadHeaders
});

exports.RevClient = RevClient;
exports.RevError = RevError;
exports['default'] = RevClient;
//# sourceMappingURL=rev-client.js.map
