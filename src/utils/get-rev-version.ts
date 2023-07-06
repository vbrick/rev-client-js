import type { RevClient } from "../rev-client";

/**
 * Get's the version of Rev returned by /js/version.js
 * @param rev
 * @param defaultVersion
 * @returns
 */
export async function getRevVersion(rev: RevClient, defaultVersion: string = ''): Promise<string> {
    try {
        const text = await rev.get<string>('/js/version.js', undefined, { responseType: 'text' }).catch(error => '');
        let [version] = ((text || '').match(/buildNumber:\s+['"]([\d.]+)/) || []).slice(1);
        return version || defaultVersion;
    } catch (error) {
        return defaultVersion;
    }
}
