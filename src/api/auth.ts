import type { RevClient } from '../rev-client';
import { Auth, OAuth } from '../types/auth';
import {buildOAuthAuthenticationQuery, buildOAuthRevOptions, parseOAuthRedirectResponse} from './oauth';

export default function authAPIFactory(rev: RevClient) {

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
         * @param oauthSecret Secret from Rev Admin -> Security. This is a DIFFERENT value from the
         *                    User Secret used for API login. Do not expose client-side!
         * @param state optional state to pass back to redirectUri once complete
         * @returns A valid oauth flow URL
         */
        async buildOAuthAuthenticationURL(config: OAuth.Config, oauthSecret: string, state: string = '1'): Promise<string> {
            const query = await buildOAuthAuthenticationQuery(config, oauthSecret, state);
            const url = new URL('/oauth/authorization', rev.url);
            url.search = `${new URLSearchParams(query)}`;
            return `${url}`;
        },
        buildOAuthAuthenticationQuery,
        parseOAuthRedirectResponse,
        async loginOAuth(config: OAuth.Config, authCode: string): Promise<OAuth.LoginResponse> {
            const GRANT_AUTH = 'authorization_code';

            const {
                oauthApiKey: apiKey,
                redirectUri
            } = config;

            // sometimes the authCode can get mangled, with the pluses in the code
            // being replaced by spaces. This is just to make sure that isn't a problem (even though already done in parseOAuthRedirectResponse)
            authCode = authCode.replace(/ /g, '+');

            // COMBAK I don't think it matters if rev-client is logged in and passing Authorization headers or not.
            return rev.post('/oauth/token', {
                authCode,
                apiKey,
                redirectUri,
                grantType: GRANT_AUTH
            });
        },
        async extendSessionOAuth(config: OAuth.Config, refreshToken: string): Promise<OAuth.LoginResponse> {
            const GRANT_REFRESH = 'refresh_token';

            const {
                oauthApiKey: apiKey
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
