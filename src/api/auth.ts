import type { RevClient } from '../rev-client';
import { Auth, OAuth } from '../types/auth';
import polyfills from '../interop';

export default function authAPIFactory(rev: RevClient) {
    const { hmacSign } = polyfills;
    const authAPI = {
        async loginToken(apiKey: string, secret: string): Promise<Auth.LoginResponse> {
            return rev.post('/api/v2/authenticate', {
                apiKey,
                secret
            });
        },
        async extendSessionToken(apiKey: string): Promise<Auth.ExtendResponse> {
            return rev.post(`/api/v2/auth/extend-session-timeout/${apiKey}`);
        },
        async logoffToken(apiKey: string): Promise<void> {
            return rev.delete(`/api/v2/tokens/${apiKey}`);
        },
        async loginUser(username: string, password: string): Promise<Auth.UserLoginResponse> {
            return rev.post('/api/v2/user/login', {
                username,
                password
            });
        },
        async logoffUser(userId: string): Promise<void> {
            return rev.post('/api/v2/user/logoff', { userId });
        },
        async extendSessionUser(userId: string): Promise<Auth.ExtendResponse> {
            return rev.post('/api/v2/user/extend-session-timeout', { userId });
        },
        async verifySession(): Promise<void> {
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
        async buildOAuthAuthenticateURL(config: OAuth.Config, state: string = '1'): Promise<string> {
            const RESPONSE_TYPE = 'code';

            const {
                oauthApiKey,
                oauthSecret,
                redirectUri
            } = config;

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
        parseOAuthRedirectResponse(url: string | URL): OAuth.RedirectResponse {
            const parsedUrl = typeof url === 'string'
                ? new URL(url)
                : url;

            const authCode: string = parsedUrl.searchParams.get('auth_code') || '';
            const state: string = parsedUrl.searchParams.get('state') || '';
            const error: string | undefined = parsedUrl.searchParams.get('error') || undefined;

            return {
                isSuccess: !error,
                authCode,
                state,
                error
            };
        },
        async loginOAuth(config: OAuth.Config, authCode: string): Promise<OAuth.LoginResponse> {
            const GRANT_AUTH = 'authorization_code';

            const {
                oauthApiKey: apiKey,
                redirectUri
            } = config;

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
        async extendSessionOAuth(config: OAuth.Config, refreshToken: string): Promise<OAuth.LoginResponse> {
            const GRANT_REFRESH = 'refresh_token';

            const {
                oauthApiKey: apiKey,
                redirectUri
            } = config;

            return rev.post('/oauth/token', {
                apiKey,
                refreshToken,
                grantType: GRANT_REFRESH
            });
        }
    };

    return authAPI;
}
