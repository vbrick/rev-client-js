import type { AccountBasicInfo } from '../types/index';
import type { RevClient } from '../rev-client';

/** @ignore */
export type API = ReturnType<typeof environmentAPIFactory>;
/**
 * @see [Environment API Docs](https://revdocs.vbrick.com/reference/user-location)
 * @category Utilities
 * @group API
 */
export interface EnvironmentAPI extends API {};

/** @ignore */
export default function environmentAPIFactory(rev: RevClient) {
    let accountId = '';
    let version = '' as AccountBasicInfo['environment']['version'];
    let ulsInfo: undefined | { enabled: boolean, locationUrls: string[] } = undefined;
    let bootstrap: undefined | Promise<AccountBasicInfo> = undefined;

    async function fallbackGetAccountId(forceRefresh = false): Promise<string> {
        if (!accountId || forceRefresh) {
            const text = await rev.get<string>('/', undefined, { responseType: 'text' }).catch(error => '');
            accountId = (/(['"])account\1[:{\s\n]*\1id\1[\s\n:]+\1([0-9a-f-]{36})\1/m.exec(text) || [])[2] || '';
        }
        return accountId;
    }

    async function fallbackGetRevVersion(forceRefresh = false) {
        if (!version || forceRefresh) {
            const text = await rev.get<string>('/js/version.js', undefined, { responseType: 'text' }).catch(error => '');
            version = (/buildNumber['":\s\n]*([\d.]+)/m.exec(text) || [])[1] || '' as any;
        }
        return version;
    }

    async function getBootstrapImpl(forceRefresh = false): Promise<AccountBasicInfo> {
        try {
            return await rev.get<AccountBasicInfo>('/api/v2/accounts/bootstrap', undefined, { responseType: 'json' });
        } catch (error) {
            const [id, version] = await Promise.all([
                fallbackGetAccountId(forceRefresh),
                fallbackGetRevVersion(forceRefresh)
            ]);
            return {
                account: { id },
                environment: { version }
            }
        }
    }

    const environmentAPI = {
        /**
         * Does not require authentication for use
         * get base information about a Rev account. This is a useful call when first initalizing a rev client, in order to ensure connectivity to Rev, as well as for getting the AccountID for use with some APIs
         */
        async bootstrap(forceRefresh = false): Promise<AccountBasicInfo> {
            if (!bootstrap || forceRefresh) {
                bootstrap = getBootstrapImpl(forceRefresh)
                // don't cache errors
                bootstrap.catch((err) => { bootstrap = undefined; });
            }
            return await bootstrap;
        },
        /**
         * Get's the accountId embedded in Rev's main entry point
         * @param forceRefresh ignore cached value if called previously
         * @param useLegacyApi force using regex-based discovery before dedicated API endpoint introduced in Rev 8.0
         */
        async getAccountId(forceRefresh = false, useLegacyApi = false): Promise<string> {
            if (!accountId || forceRefresh) {
                accountId = useLegacyApi
                    ? await fallbackGetAccountId(forceRefresh)
                    : (await getBootstrapImpl(forceRefresh)).account.id;
            }
            return accountId;
        },
        /**
         * Get's the version of Rev returned by /js/version.js
         * @param forceRefresh ignore cached value if called previously
         * @param useLegacyApi force using regex-based discovery before dedicated API endpoint introduced in Rev 8.0
         */
        async getRevVersion(forceRefresh = false, useLegacyApi = false): Promise<string> {
            if (!version || forceRefresh) {
                version = useLegacyApi
                    ? await fallbackGetRevVersion(forceRefresh)
                    : (await getBootstrapImpl(forceRefresh)).environment.version;
            }
            return version;
        },
        /**
         * Use the Get User Location Service API to get a user's IP address for zoning purposes
         * Returns the IP if ULS enabled and one successfully found, otherwise undefined.
         * undefined response indicates Rev should use the user's public IP for zoning.
         * @param timeoutMs    - how many milliseconds to wait for a response (if user is not)
         *                       on VPN / intranet with ULS DME then DNS lookup or request
         *                       can time out, so don't set this too long.
         *                       Default is 10 seconds
         * @param forceRefresh   By default the User Location Services settings is cached
         *                       (not the user's detected IP). Use this to force reloading
         *                       the settings from Rev.
         * @returns
         */
        async getUserLocalIp(timeoutMs = 10 * 1000, forceRefresh = false): Promise<string | undefined> {
            if (!ulsInfo || forceRefresh) {
                ulsInfo = await rev.get('/api/v2/user-location');
            }
            // if User Location Services isn't enabled then return undefined, meaning Rev will just use user's public IP for zoning
            if (!ulsInfo?.enabled || ulsInfo.locationUrls.length === 0) {
                return undefined;
            }
            const controller = new AbortController();
            const getIp = async function (ulsUrl: string) {
                try {
                    let {ip = ''} = await rev.get<{ ip: string }>(ulsUrl, {}, {
                        headers: { Authorization: '' },
                        responseType: 'json',
                        signal: controller.signal
                    });
                    ip = `${ip}`.split(',')[0].trim();
                    if (ip) {
                        // cancel any other requests early
                        controller.abort();
                    }
                    return ip;
                } catch (error) {
                    rev.log('debug', `ULS URL Failed: ${ulsUrl}`, error);
                    return undefined;
                }
            }

            const timer = setTimeout(() => controller.abort(), timeoutMs);
            try {
                // collect all returned IPs...first response will abort others early
                const ips = await Promise.all(ulsInfo.locationUrls.map(getIp));
                return ips.find(ip => !!ip);
            } finally {
                clearTimeout(timer);
            }
        }
    };

    return environmentAPI;
}
