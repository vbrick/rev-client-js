import type { OAuth } from '../types/auth';
import polyfills from '../interop';
import type { Rev } from '../types/rev';

const PLACEHOLDER = 'http://rev';

export function getOAuth2AuthorizationUrl(config: OAuth.ServerConfig, code_challenge: string, state?: string) {
    // construct URL with query params
    const url = new URL('/api/v2/oauth2/authorize', config.revUrl);
    url.search = new URLSearchParams({
        client_id: config.oauthApiKey,
        code_challenge,
        response_type: 'code',
        redirect_uri: config.redirectUri,
        ...state && {state}
    }).toString();

    return url.toString();
}

/**
 *
 * @param codeVerifier value can be any string 43-128 characters in length, just these characters: [A-Za-z0-9._~-]
 */
export async function getOAuth2PKCEVerifier(codeVerifier = polyfills.randomValues(48)) {
    // setup pkce
    // value can be any string 43-128 characters in length, just these characters: [A-Za-z0-9._~-]
    // this line uses random values to create 64char string
    const codeChallenge = await polyfills.sha256Hash(codeVerifier);
    return { codeVerifier, codeChallenge };
}

/**
 * Constructs the query parameters for the Rev /oauth/authorization endpoint
 * @param config OAuth signing settings, retrieved from Rev Admin -> Security -> API Keys page, along with revUrl
 * @param state optional state to pass back to redirectUri once complete
 * @returns A valid oauth flow endpoint + query
 */
export async function buildLegacyOAuthQuery(config: OAuth.Config, oauthSecret: string, state: string = '1') {
    const { hmacSign } = polyfills;

    const RESPONSE_TYPE = 'code';

    const {
        oauthApiKey: apiKey,
        redirectUri
    } = config;

    const timestamp = new Date();
    const verifier = `${apiKey}::${timestamp.toISOString()}`;

    const signature = await hmacSign(verifier, oauthSecret);

    return {
        apiKey,
        signature,
        verifier,
        'redirect_uri': redirectUri,
        'response_type': RESPONSE_TYPE,
        state
    };
}

/**
 * Parse the query parameters returned to the redirectUri from Rev
 * @param url The URL with query parameters, or object with the query parrameters
 * @returns
 */
export function parseLegacyOAuthRedirectResponse(url: string | URL | URLSearchParams | Record<string, string>): OAuth.RedirectResponse {
    if (typeof url === 'string') {
        // just in case only the query string is returned, include base
        url = new URL(url, PLACEHOLDER);
    }

    if (url instanceof URL) {
        url = url.searchParams;
    }

    const query: Record<string, string> = (url instanceof URLSearchParams)
        ? Object.fromEntries(url)
        : url;

    const {
        'auth_code': authCode = '',
        state = '',
        error = undefined
    } = query;

    return {
        isSuccess: !error,
        // URL parsing parses pluses (+) as spaces, which can cause later validation to fail
        authCode: `${authCode}`.replace(/ /g, '+'),
        state,
        error
    };
}

/**
 * Format the oauth configuration and oauth response into the constructor arguments for RevClient
 * @param revUrl
 * @param config
 * @param response
 * @returns {Rev.Options}
 */
export function buildLegacyOAuthRevOptions(revUrl: string, config: OAuth.Config, response: OAuth.RedirectResponse): Rev.Options {
    const {
        oauthApiKey,
        redirectUri
    } = config;

    const {
        authCode
    } = response;

    return {
        url: revUrl,
        authCode,
        oauthConfig: {
            oauthApiKey,
            redirectUri
        }
    };
}
