export namespace Auth {
    export interface LoginResponse {
        token: string;
        /** Always "VBrick" */
        issuer: string;
        /** ISO Date format */
        expiration: string;
    }
    export interface UserLoginResponse extends LoginResponse {
        email: string;
        /** User ID */
        id: string;
        username?: string;
        firstName?: string;
        lastName?: string;
        language?: string;
    }

    export interface JWTLoginResponse {
        accessToken: string;
        expiration: string;
        language?: string;
    }

    export interface GuestRegistrationResposne {
        accessToken: string;
        csrfToken: string;
    }

    export interface ExtendResponse {
        /** ISO Date format */
        expiration: string;
    }
}

export namespace OAuth {
    export interface Config {
        /**
         * API key from Rev Admin -> Security. This is a DIFFERENT value from the
         *     User Token used for API login/extend session
         */
        oauthApiKey: string;
        /**
         * The local URL that Rev should redirect user to after logging in. This must
         *     match EXACTLY what's specified in Rev Admin -> Security for the
         * 	   specified API key
         */
        redirectUri: string;
    }
    /**
     * Oauth configuration object for use with buildOAuthAuthenticateURL.
     * For server-side use only.
     */
    export interface ServerConfig extends Config {
        /**
         * The URL of destination Rev server
         */
        revUrl?: string;
    }
    /** @deprecated */
    export interface LoginResponse {
        /**
        * The Vbrick access token used as "Authorization" header for subsequent requests
        */
        accessToken: string;
        /**
         * The refresh token that can be used to refresh an access_token when it expires.
         */
        refreshToken: string;
        /**
         * User Id.
         */
        userId: string;
        /**
         * Token expiration time in seconds
         */
        expiration: string; // date-time
        /**
         * The Token issuer, always "Vbrick"
         */
        issuedBy: string;
    }
    /** @deprecated */
    export interface RedirectResponse {
        isSuccess: boolean,
        authCode: string,
        state: string,
        error?: string;
    }
    export interface AuthenticationData {
        /** The URL for requesting OAuth2 authorization */
        url: string,
        /** the code_verifier that matches the codeChallenge in authorize url - store for requesting the access token */
        codeVerifier: string
    }
    export interface CallbackResponse {
        code: string;
        state: string;
    }
    export interface AuthTokenResponse {
        access_token: string;
        refresh_token: string;
        userId: string;
        expires_in: string;
        username: string;
        firstName: string;
        lastName: string;
    }
}
