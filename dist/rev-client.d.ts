type CacheOption = boolean | 'Force';
declare function adminAPIFactory(rev: RevClient): {
    /**
    * get mapping of role names to role IDs
    * @param cache - if true allow storing/retrieving from cached values. 'Force' means refresh value saved in cache
    */
    roles(cache?: CacheOption): Promise<Role.Details[]>;
    /**
    * Get a Role (with the role id) based on its name
    * @param name Name of the Role OR RoleType. You can specify the specific enum value (preferred, only Rev 7.53+), or the localized string value in the current user's language, i.e. "Media Viewer" for english
    * @param fromCache - if true then use previously cached Role listing (more efficient)
    */
    getRoleByName(name: Role.RoleType | Role.RoleName, fromCache?: CacheOption): Promise<Role>;
    /**
    * get list of custom fields
    * @param cache - if true allow storing/retrieving from cached values. 'Force' means refresh value saved in cache
    */
    customFields(cache?: CacheOption): Promise<Admin.CustomField[]>;
    /**
    * Get a Custom Field based on its name
    * @param name name of the Custom Field
    * @param fromCache if true then use previously cached Role listing (more efficient)
    */
    getCustomFieldByName(name: string, fromCache?: CacheOption): Promise<Admin.CustomField>;
    brandingSettings(): Promise<Admin.BrandingSettings>;
    webcastRegistrationFields(): Promise<RegistrationField & {
        id: string;
    }>;
    createWebcastRegistrationField(registrationField: RegistrationField.Request): Promise<string>;
    updateWebcastRegistrationField(fieldId: string, registrationField: Partial<RegistrationField.Request>): Promise<void>;
    deleteWebcastRegistrationField(fieldId: string): Promise<void>;
    listIQCreditsUsage(query: {
        startDate?: string | Date;
        endDate?: string | Date;
    }, options?: Rev.SearchOptions<Admin.IQCreditsSession>): Rev.ISearchRequest<Admin.IQCreditsSession>;
    /**
    * get system health - returns 200 if system is active and responding, otherwise throws error
    */
    verifySystemHealth(): Promise<boolean>;
    /**
    * gets list of scheduled maintenance windows
    */
    maintenanceSchedule(): Promise<{
        start: string;
        end: string;
    }[]>;
    /**
     * gets the user location service URL
     */
    userLocationService(): Promise<{
        enabled: boolean;
        locationUrls: string[];
    }>;
    /**
     * returns an array of all expiration rules
     */
    expirationRules(): Promise<Admin.ExpirationRule[]>;
    featureSettings(videoId?: string): Promise<Admin.FeatureSettings>;
};

declare enum RateLimitEnum {
    Get = "get",
    Post = "post",
    SearchVideos = "searchVideos",
    UploadVideo = "uploadVideo",
    AuditEndpoints = "auditEndpoint",
    UpdateVideoMetadata = "updateVideo",
    GetUsersByLoginDate = "loginReport",
    GetVideoDetails = "videoDetails",
    GetWebcastAttendeesRealtime = "attendeesRealtime",
    GetVideoViewReport = "viewReport"
}

declare namespace Auth {
    interface LoginResponse {
        token: string;
        /** Always "VBrick" */
        issuer: string;
        /** ISO Date format */
        expiration: string;
    }
    interface UserLoginResponse extends LoginResponse {
        email: string;
        /** User ID */
        id: string;
        username?: string;
        firstName?: string;
        lastName?: string;
        language?: string;
    }
    interface JWTLoginResponse {
        accessToken: string;
        expiration: string;
        language?: string;
    }
    interface GuestRegistrationResposne {
        accessToken: string;
        csrfToken: string;
    }
    interface ExtendResponse {
        /** ISO Date format */
        expiration: string;
    }
}
declare namespace OAuth {
    interface Config {
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
    interface ServerConfig extends Config {
        /**
         * The URL of destination Rev server
         */
        revUrl?: string;
    }
    /** @deprecated */
    interface LoginResponse {
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
        expiration: string;
        /**
         * The Token issuer, always "Vbrick"
         */
        issuedBy: string;
    }
    /** @deprecated */
    interface RedirectResponse {
        isSuccess: boolean;
        authCode: string;
        state: string;
        error?: string;
    }
    interface AuthenticationData {
        /** The URL for requesting OAuth2 authorization */
        url: string;
        /** the code_verifier that matches the codeChallenge in authorize url - store for requesting the access token */
        codeVerifier: string;
    }
    interface CallbackResponse {
        code: string;
        state: string;
    }
    interface AuthTokenResponse {
        access_token: string;
        refresh_token: string;
        userId: string;
        expires_in: string;
        username: string;
        firstName: string;
        lastName: string;
    }
}

type LiteralString<T> = T | (string & Record<never, never>);
type FetchResponse = Response;
declare namespace Rev {
    type HTTPMethod = LiteralString<'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD'>;
    type ResponseType = LiteralString<'json' | 'text' | 'blob' | 'stream' | 'webstream' | 'nativestream'>;
    type PatchOperation = {
        op: 'add' | 'remove' | 'replace';
        path: string;
        value?: any;
    };
    interface Response<T> {
        statusCode: number;
        headers: Headers;
        body: T;
        response: FetchResponse;
    }
    interface IRevSessionState {
        token: string;
        expiration: Date | string;
        /** Required if using username login */
        userId?: string;
        /** Required if using OAuth login */
        refreshToken?: string;
        /** if using ApiKey login */
        apiKey?: string;
    }
    interface Credentials {
        /** Username of Rev User (for login) - this or apiKey must be specified */
        username?: string;
        /** Password of Rev User (for login) - this or secret must be specified */
        password?: string;
        /** API Key forRev User (for login) - this or username must be specified */
        apiKey?: string;
        /** API Secret for Rev User (for login) - this or password must be specified */
        secret?: string;
        /** oauth configuration values for oauth token management */
        oauthConfig?: OAuth.Config;
        /** authCode from deprecated legacy oauth authorization flow */
        authCode?: string;
        /** code from oauth2 authorization flow */
        code?: string;
        /** code verifier from oauth2 authorization flow */
        codeVerifier?: string;
        /** JWT Token */
        jwtToken?: string;
        /** Webcast Guest Registration */
        guestRegistrationToken?: string;
        /** Webcast ID for Guest Registration */
        webcastId?: string;
        /** existing token/extend session details */
        session?: Rev.IRevSessionState;
        /** use public APIs only - no authentication */
        publicOnly?: boolean;
    }
    type LogSeverity = LiteralString<'debug' | 'info' | 'warn' | 'error'>;
    type LogFunction = (severity: LogSeverity, ...args: any[]) => void;
    interface Options extends Credentials {
        /** URL of Rev account */
        url: string;
        /** Logging function - default is log to console */
        log?: LogFunction;
        /** Enable/disable logging */
        logEnabled?: boolean;
        /** If true then automatically extend the Rev session at regular intervals, until
         *     rev.disconnect() is called. Optionally, pass in keepAlive options instead of `true`
         */
        keepAlive?: boolean | KeepAliveOptions;
        rateLimits?: boolean | Rev.RateLimits;
        /**
         * Specify the default response type for streaming responses
         * 'stream': whatever underlying library returns (NodeJS Readable for node-fetch, ReadableStream otherwise)
         * 'webstream': always return a ReadableStream
         * 'nativestream': always return native stream type (NodeJS Readable on NodeJS, ReadableStream otherwise)
         */
        defaultStreamPreference?: 'stream' | 'webstream' | 'nativestream';
    }
    type RateLimits = {
        [K in RateLimitEnum]?: number;
    };
    interface IRevSession {
        token?: string;
        expires: Date;
        readonly isExpired: boolean;
        readonly isConnected: boolean;
        readonly hasRateLimits: boolean;
        readonly username: string | undefined;
        login(): Promise<void>;
        extend(): Promise<void>;
        logoff(): Promise<void>;
        verify(): Promise<boolean>;
        lazyExtend(options?: Rev.KeepAliveOptions): Promise<boolean>;
        toJSON(): Rev.IRevSessionState;
        queueRequest(queue: `${RateLimitEnum}`): Promise<void>;
    }
    interface RequestOptions extends Partial<RequestInit> {
        /**
         * specify body type when decoding. Use 'stream' to skip parsing body completely
         */
        responseType?: ResponseType;
        /**
         * whether to throw errors or not for HTTP error response codes.
         * @default true
         */
        throwHttpErrors?: boolean;
    }
    interface ISearchRequest<T> extends AsyncIterable<T> {
        current: number;
        total?: number;
        done: boolean;
        nextPage(): Promise<SearchPage<T>>;
        exec(): Promise<T[]>;
    }
    interface SearchOptions<T> {
        /**
         * maximum number of search results
         */
        maxResults?: number;
        /**
         * callback per page
         */
        onProgress?: (items: T[], current: number, total?: number | undefined) => void;
        /**
         * Search results use a scrollID cursor that expires after 1-5 minutes
         * from first request. If the scrollID expires then onScrollExpired
         * will be called with a ScrollError. Default behavior is to throw
         * the error.
         *
         * Note that request level errors (like 401 or 500) will just be thrown as normal,
         * not passed to this function
         */
        onError?: (err: Error | ScrollError) => void;
        /**
         * Use onError instead
         * @deprecated use onError instead
         */
        onScrollError?: (err: ScrollError) => void;
        signal?: AbortSignal | undefined;
    }
    interface AccessEntitySearchOptions<T> extends SearchOptions<T> {
        assignable?: boolean;
    }
    interface SearchDefinition<T = any, RawType = any> {
        endpoint: string;
        totalKey: string;
        hitsKey: string;
        isPost?: boolean;
        request?: (endpoint: string, query?: Record<string, any>, options?: RequestOptions) => Promise<Record<string, any>>;
        transform?: (items: RawType[]) => T[] | Promise<T[]>;
    }
    interface KeepAliveOptions {
        /**
         * How many milliseconds between automatic extend session calls
         * Default 5 minutes
         * @default 300000
         */
        keepAliveInterval?: number;
        /**
         * How many milliseconds before session is set to expire to
         *     proactively extend the session. Sane values are in the
         *     1-10 minutes range (default 3 min = 180000)
         * @default 180000
         */
        extendThresholdMilliseconds?: number;
        /**
         * If true (default) then make a verify API call to ensure
         * session has a valid session. Otherwise do nothing if
         * session has not expired (or within threshold)
         * @default true
         */
        verify?: boolean;
    }
    /**
     * Returned from scrollPageStream helper for each results page of a search endpoint
     */
    interface SearchPage<T> {
        items: T[];
        current: number;
        total?: number;
        done: boolean;
    }
    type SortDirection = LiteralString<'asc' | 'desc'>;
    type FileUploadType = string | URL | File | Blob | Response<any> | AsyncIterable<any>;
    interface UploadFileOptions extends Rev.RequestOptions {
        /** specify filename of video as reported to Rev */
        filename?: string;
        /** specify content type of video */
        contentType?: string;
        /** if content length is known this will avoid needing to detect it */
        contentLength?: number;
        /** node-only - bypass dealing with content length and just upload as transfer-encoding: chunked */
        useChunkedTransfer?: boolean;
        /** Default content type to use if cannot be determined from input blob/filename */
        defaultContentType?: string;
        /**
         * Block any loads of external resources (file paths/network fetch).
         * If true then you must explicitly pass in Flie/Blob or ReadableStreams
         * @default {false}
         */
        disableExternalResources?: boolean;
    }
}

declare namespace AccessControl {
    type EntityType = 'User' | 'Group' | 'Role' | 'Channel';
    interface Entity {
        id: string;
        name: string;
        type: EntityType;
        canEdit: boolean;
    }
    type EntitySearchType = Exclude<AccessControl.EntityType, 'Role'>;
    interface SearchHit {
        EntityType: EntitySearchType;
        Id: string;
        Name?: string;
        UserName?: string;
        FirstName?: string;
        LastName?: string;
        Email?: string;
        ProfileImageUri?: string;
    }
}

declare namespace Video {
    type AccessControl = LiteralString<"AllUsers" | "Public" | "Private" | "Channels">;
    type ApprovalStatus = LiteralString<'Approved' | 'PendingApproval' | 'Rejected' | 'RequiresApproval' | 'SubmittedApproval'>;
    type EncodingType = LiteralString<"H264" | "HLS" | "HDS" | "H264TS" | "Mpeg4" | "Mpeg2" | "WM" | "Flash" | "RTP">;
    type ExpirationAction = LiteralString<'Delete' | 'Inactivate'>;
    type ExpiryRule = LiteralString<'None' | 'DaysAfterUpload' | 'DaysWithoutViews'>;
    type SourceType = LiteralString<'REV' | 'WEBEX' | 'API' | 'VIDEO CONFERENCE' | 'WebexLiveStream' | 'LiveEnrichment'>;
    type VideoType = LiteralString<"Live" | "Vod">;
    type SortFieldEnum = LiteralString<"title" | "_score" | "recommended" | "whenUploaded" | "whenPublished" | "whenModified" | "lastViewed" | "ownerName" | "uploaderName" | "duration" | "viewCount" | "averageRating" | "commentCount">;
    type StatusEnum = LiteralString<"NotUploaded" | "Uploading" | "UploadingFinished" | "NotDownloaded" | "Downloading" | "DownloadingFinished" | "DownloadFailed" | "Canceled" | "UploadFailed" | "Processing" | "ProcessingFailed" | "ReadyButProcessingFailed" | "RecordingFailed" | "Ready">;
    type SearchFilterEnum = LiteralString<"myRecommendations" | "mySubscriptions">;
    type MetadataGenerationField = LiteralString<"description" | "title" | "tags" | "all" | "chapters">;
    type MetadataGenerationStatus = LiteralString<"NotStarted" | "InProgress" | "Success" | "Failed">;
    interface LinkedUrl {
        Url: string;
        EncodingType: EncodingType;
        Type: VideoType;
        IsMulticast: boolean;
    }
    interface SearchHit {
        id: string;
        title: string;
        description: string;
        categories: string[];
        tags: string[];
        thumbnailUrl: string;
        playbackUrl: string;
        duration: string;
        viewCount: number;
        status: string;
        approvalStatus: string;
        uploader: string;
        uploadedBy: string;
        whenUploaded: string;
        lastViewed: string;
        owner?: {
            fullname: string;
            id: string;
            username: string;
            profileImageUri?: string;
        };
        averageRating: number;
        ratingsCount: number;
        speechResult: Array<{
            time: string;
            text: string;
        }>;
        unlisted: boolean;
        whenModified: string;
        whenPublished: string;
        commentCount: number;
        hasHls: boolean;
        thumbnailSheets: string;
        score: number;
    }
    interface UploadMetadata {
        /** required - uploader of video */
        uploader: string;
        /** Title of the video being uploaded. If title is not specified, API will use uploaded filename as the title. */
        title?: string;
        /** Description - safe html will be preserved */
        description?: string;
        /** list of category names */
        categories?: string[];
        /** An array of category IDs */
        categoryIds?: string[];
        /** An array of strings that are tagged to the  */
        tags?: string[];
        /**  */
        isActive?: boolean;
        /**
         * @default {false}
         */
        enableRatings?: boolean;
        /**
         * @default {false}
         */
        enableDownloads?: boolean;
        /**
         * @default {false}
         */
        enableComments?: boolean;
        enableExternalApplicationAccess?: boolean;
        enableExternalViewersAccess?: boolean;
        /**
         * This sets access control for the  This is an enum and can have the following values: Public/AllUsers/Private/Channels.
         */
        videoAccessControl?: AccessControl;
        /**
         * This provides explicit rights to a User/Group/Collection with/without CanEdit access to a  This is an array with properties; Name (entity name), Type (User/Group/Collection), CanEdit (true/false). If any value is invalid, it will be rejected while valid values are still associated with the
         */
        accessControlEntities?: (Omit<AccessControl.Entity, 'id'> | Omit<AccessControl.Entity, 'name'>)[];
        /**
         * A Password for Public Video Access Control. Use this field when the videoAccessControl is set to Public. If not this field is ignored.
         */
        password?: string;
        /** An array of customFields that is attached to the  */
        customFields?: Admin.CustomField.Request[];
        doNotTranscode?: boolean;
        is360?: boolean;
        unlisted?: boolean;
        /** must be date-only YYYY-MM-DD */
        publishDate?: string;
        userTags?: string[];
        /** owner of video, defaults to uploader. only one key is necessary */
        owner?: {
            userId?: string;
            username?: string;
            email?: string;
        };
        sourceType?: SourceType;
        /**
         * Default=false. Displays viewer information over the video for playback on the web.
         */
        viewerIdEnabled?: boolean;
        /**
         * When chapter images exist, the video playback can be enabled to show or hide the images by default.
         */
        enableAutoShowChapterImages?: boolean;
        /**
         * Retain the total views count from an outside system as an optional param.
         */
        legacyViewCount?: number;
        /**
         * Transcribe the video once the upload is complete.
         */
        postUploadActions?: {
            /**
             * Language code. View Supported Languages for source languages in Technical Requirements.
             */
            transcribeLanguageId: string;
            /**
             * Creates AI-generated metadata for a given video based on the type specified. You must specify the field type you want to generate (description/title/tags/chapters).
             * This feature requires English transcription and must also be enabled for your Rev account.
             */
            metadataGenerationFields?: Array<LiteralString<'title' | 'description' | 'tags' | 'chapters'>>;
        };
    }
    type UpdateRequest = Omit<Video.UploadMetadata, 'uploader' | 'categoryIds' | 'doNotTranscode' | 'is360' | 'sourceType' | 'legacyViewCount' | 'postUploadActions'> & {
        /**
         * List of category IDs. If you use categoryIds and they do not exist/are incorrect, the request is rejected. The request is also rejected if you do not have contribute rights to a restricted category and you attempt to add/edit or otherwise modify it.
         */
        categories?: string;
        audioTracks?: Array<{
            track: number;
            languageId: string;
        }>;
        expirationDate?: string;
        expirationAction?: Video.ExpirationAction;
        linkedUrl?: Video.LinkedUrl;
    };
    interface MigrateRequest {
        /** change "uploader" value to this user */
        userName?: string;
        /** change "owner" to this user. Owner takes precedence over Uploader field in sorting/UI */
        owner?: {
            userId: string;
        };
        /** When video was first uploaded (ISO Date) */
        whenUploaded?: Date | string;
        /** By default, the publishDate is set to the current date the video is
            set to Active status. You can also set the publishDate to a date in the future
            to make the video Active at that time. If the video is already Active, the
            publishDate can be set to a date in the past.
        */
        publishDate?: Date | string;
        /**
         * Retain the total views count from an outside system as an optional param.

         */
        legacyViewCount?: number;
    }
    interface Details {
        /** Video ID */
        id: string;
        /** Title of the video being uploaded. If title is not specified, API will use uploaded filename as the title. */
        title: string;
        /** Description in plain text */
        description: string;
        /** Description with HTML tags included */
        htmlDescription: string;
        /** An array of strings that are tagged to the  */
        tags: string[];
        /** An array of category IDs */
        categories: string[];
        /** An array of categories with full details (id + full path) */
        categoryPaths: Array<{
            categoryId: string;
            name: string;
            fullPath: string;
        }>;
        /** An array of customFields that is attached to the  */
        customFields: Admin.CustomField[];
        /** when video was uploaded (ISO Date) */
        whenUploaded: string;
        /** When video was last modified (ISO Date) */
        whenModified: string;
        /** the full name of user who uploaded video */
        uploadedBy: string;
        owner: {
            firstName: string;
            lastName: string;
            userId: string;
            userName: string;
        };
        /** if video is active or not */
        isActive: boolean;
        /** This is the processing status of a  */
        status: StatusEnum;
        linkedUrl: LinkedUrl | null;
        approvalStatus: ApprovalStatus;
        approval: {
            status: ApprovalStatus;
            approvalProcessId: null | string;
            approvalProcessName: null | string;
            steps: Array<{
                stepId: string;
                stepName: string;
                approverName: string;
                approverId: string;
                whenRequested: string;
                whenResponded: string;
                status: string;
            }>;
            whenSubmittedForApproval: null | string;
            stepId: null | string;
            approvalProcessReferenced: boolean;
        };
        /** type of video - live or VOD */
        type: VideoType;
        /**
         * This sets access control for the  This is an enum and can have the following values: Public/AllUsers/Private/Channels.
         */
        videoAccessControl: AccessControl;
        /**
         * This provides explicit rights to a User/Group/Collection with/without CanEdit access to a  This is an array with properties; Name (entity name), Type (User/Group/Collection), CanEdit (true/false). If any value is invalid, it will be rejected while valid values are still associated with the
         */
        accessControlEntities: Array<AccessControl.Entity>;
        /**
         * A Password for Public Video Access Control. Use this field when the videoAccessControl is set to Public. If not this field is ignored.
         */
        password: string | null;
        /**
         * source of original video
         */
        sourceType: SourceType;
        source: LiteralString<'Upload' | 'Link' | 'ScheduledEvent' | 'Webex' | 'Upload360' | 'ScheduledRecording'>;
        expirationDate: string | null;
        /**
         * This sets action when video expires. This is an enum and can have the following values: Delete/Inactivate.
         */
        expirationAction: ExpirationAction | null;
        expiration: {
            ruleId: string | null;
            expirationDate: string | null;
            expiryRuleType: ExpiryRule;
            numberOfDays: number | null;
            deleteOnExpiration: boolean | null;
        } | null;
        /**
         * date video will be published
         * NOTE: Must be in YYYY-MM-DD format
         */
        publishDate: `${number}${number}${number}${number}-${number}${number}-${number}${number}` | null;
        lastViewed: string;
        totalViews: number;
        avgRating: number;
        ratingsCount: number;
        commentsCount: number;
        thumbnailKey: string;
        thumbnailUrl: string;
        enableRatings: boolean;
        enableDownloads: boolean;
        enableComments: boolean;
        enableExternalApplicationAccess: boolean;
        enableExternalViewersAccess: boolean;
        closeCaptionsEnabled: boolean;
        unlisted: boolean;
        is360: boolean;
        userTags: Array<{
            userId: string;
            displayName: string;
        }>;
        duration: string;
        audioTracks: Array<{
            track: number;
            isDefault: boolean;
            languageId: string;
            languageName: string;
            status: Transcription.Status;
        }>;
        overallProgress: number;
        isProcessing: boolean;
        transcodeFailed: boolean;
        instances: Array<{
            id: string;
            isOriginalInstance: boolean;
            name: string | null;
            preset: {
                container?: string;
            };
            size: number;
            status: LiteralString<'Initialized' | 'Transcoding' | 'Transcoded' | 'TranscodingFailed' | 'Storing' | 'Stored' | 'StoringFailed'>;
            videoKey: string;
        }>;
        videoConference?: {
            whenRecordingStarted: string;
            sipAddress: string;
            sipPin: string;
            bitrateKbps: number;
            microsoftTeamsMeetingUrl: string;
        } | null;
        chapters: {
            chapters: Array<{
                extension: string;
                /** can get full URL to download as
                 * "/api/v2/media/videos/thumbnails/{{videoId}}/slides/{{imageId}}.jpg"
                 */
                imageId: string;
                time: string;
                title: string;
            }>;
        };
        hasAudioOnly: boolean;
        viewerIdEnabled: boolean;
        enableAutoShowChapterImages: boolean;
    }
    interface PatchRequest {
        title?: string;
        categories?: string | string[];
        description?: string;
        tags?: string | string[];
        isActive?: boolean;
        expirationDate?: string;
        enableRatings?: boolean;
        enableDownloads?: boolean;
        enableComments?: boolean;
        enableExternalApplicationAccess?: boolean;
        enableExternalViewersAccess?: boolean;
        videoAccessControl?: AccessControl;
        accessControlEntities: string | string[];
        customFields: Admin.CustomField.Request[];
        unlisted?: boolean;
        userTags?: string[];
    }
    interface StatusResponse {
        videoId: string;
        title: string;
        status: StatusEnum;
        isProcessing: boolean;
        overallProgress: number;
        isActive: boolean;
        uploadedBy: string;
        whenUploaded: string;
    }
    interface SearchOptions {
        /** text to search for */
        q?: string;
        /** specific videoIds to search for */
        videoIds?: string | string[];
        /**
         * live or vod videos
         */
        type?: VideoType;
        /**
         * list of category IDs separated by commas. pass blank to get uncategorized only
         */
        categories?: string;
        /** list of uploader names separated by commas */
        uploaders?: string;
        /** list of uploader IDs separated by commas */
        uploaderIds?: string;
        /** Include the first name and last name of the owner. Note that partial matches may be returned. Example: owners="john doe" is going to retrieve all videos owned by the user with first name and last name = "john doe". To return an exact result you must use the ownerIds query string. */
        owners?: string;
        /** Owner GUIDs to get specific videos owner by these users. Example: ownerIds=abc, xyz */
        ownerIds?: string;
        status?: LiteralString<'active' | 'inactive'>;
        fromPublishedDate?: string;
        toPublishedDate?: string;
        fromUploadDate?: string;
        toUploadDate?: string;
        fromModifiedDate?: string;
        toModifiedDate?: string;
        exactMatch?: boolean;
        unlisted?: LiteralString<'unlisted' | 'listed' | 'all'>;
        /**
         * If provided, the query results are fetched on the provided searchField only.
         * If the exactMatch flag is also set along with searchField, then the results are fetched for
         * an exact match on the provided searchField only.
         */
        searchField?: LiteralString<'title' | 'tags' | 'categories' | 'uploader'>;
        includeTranscriptSnippets?: boolean;
        /**
         * Show recommended videos for the specified Username. Videos returned are based on the user’s
         * last 10 viewed videos. Must be Account Admin or Media Admin to use this query. Sort order
         * must be _score. User must exist.
         */
        recommendedFor?: string;
        sortField?: SortFieldEnum;
        sortDirection?: Rev.SortDirection;
        /** if true only HLS videos are returned */
        hasHls?: boolean;
        /**
         * If channelId provided, videos in that particular channel are returned. User should have rights to the channel
         */
        channelId?: string;
        /**
         * Filter the results based on the channels and categories the Principal is subscribed OR apply the recommendation logic which boosts search results based on recent viewing history using up to the last 10 videos viewed by a user.
         */
        filter?: SearchFilterEnum;
        /** Number of videos to get (default is 50) */
        count?: number;
        /**
         * search for videos matching specific custom field values.
         * Object in the format {My_Custom_Field_Name: "MyCustomFieldValue"}
         */
        [key: string]: any;
    }
    interface Playback {
        id: string;
        title: string;
        categories: Category[];
        description: string;
        htmlDescription: string;
        tags: string[];
        thumbnailUrl: string;
        playbackUrl: string;
    }
    interface PlaybackUrlsRequest {
        /**
         * IP address of viewer that will use this stream - used for Zoning rules.
         * Use the User Location Service endpoint to get the correct IP
         * await revClient.admin.userLocationService()
         * https://revdocs.vbrick.com/reference/user-location
         * If not specified then the public IP address of rev client will be used
         */
        ip?: string;
        /**
         * Override user agent of viewer. This should match the eventual viewing
         * browser device, otherwise authenticated streams may return Unauthorized.
         * Default is to use user agent of rev client.
         */
        userAgent?: string;
    }
    interface PlaybackUrlsResponse {
        playbackResults: PlaybackUrlResult[];
        jwtToken: string;
    }
    interface PlaybackUrlResult {
        label: string;
        qValue: number;
        player: LiteralString<'Native' | 'Vbrick' | 'NativeIos' | 'NativeAndroid' | 'NativeMfStb'>;
        url: string;
        zoneId: string;
        zoneName?: string;
        slideDelaySeconds: number;
        name?: null | LiteralString<'RevConnect'>;
        videoFormat: string;
        videoInstanceId: string;
        deviceId?: string;
        deviceName?: string;
        isEnriched: boolean;
        streamDeliveryType: LiteralString<'PublicCDN' | 'ECDN' | 'Custom'>;
    }
    interface VideoReportEntry {
        videoId: string;
        title: string;
        username: string;
        firstName: string;
        lastName: string;
        emailAddress: string;
        completed: boolean;
        zone: string;
        device: string;
        browser: string;
        userDeviceType: string;
        playbackUrl: string;
        dateViewed: string;
        viewingTime: string;
        publicCDNTime?: string;
        eCDNTime?: string;
        viewingStartTime: string;
        viewingEndTime: string;
        userId: string;
    }
    interface VideoReportOptions extends Rev.SearchOptions<VideoReportEntry> {
        videoIds?: string | string[] | undefined;
        startDate?: string;
        endDate?: string;
        incrementDays?: number;
        sortDirection?: Rev.SortDirection;
    }
    interface UniqueSessionReportOptions extends Rev.SearchOptions<VideoReportEntry> {
        userId?: string;
        startDate?: string;
        endDate?: string;
        incrementDays?: number;
        sortDirection?: Rev.SortDirection;
    }
    interface SummaryStatistics {
        totalViews: number;
        totalSessions: number;
        totalTime: string;
        averageTime: string;
        completionRate: number;
        totalUniqueViews: number;
        deviceCounts: Array<{
            key: string;
            value: number;
        }>;
        totalViewsByDay: Array<{
            key: string;
            value: number;
        }>;
        browserCounts: Array<{
            key: string;
            value: number;
        }>;
    }
    interface Comment {
        id: string;
        text: string;
        date: string;
        username: string;
        firstName: string;
        lastName: string;
        isRemoved: boolean;
        childComments: Comment[];
    }
    namespace Comment {
        interface Request {
            /**
             * The text of the comment
             */
            comment: string;
            /**
             * Username submitting the comment. This user must exist in Rev. Unless
             * the user has been assigned the Account Admin role, this user must
             * also match the authenticated user making the API call.
             */
            userName: string;
            /**
             * If not provided, parent comment will be created. If parent commentId
             * is provided, then it will create child comment to that parent. If
             * child commentid is provided, then child comment for the corresponding
             * parent comment will be created.
             */
            commentId?: string;
        }
        interface ListResponse {
            id: string;
            title: string;
            comments: Comment[];
        }
        interface Unredacted extends Comment {
            isRemoved: boolean;
            deletedBy: string | null;
            deletedWhen: string;
        }
    }
    interface Chapter {
        title: string;
        startTime: string;
        imageUrl: string;
    }
    namespace Chapter {
        interface Request {
            /**
             * time in 00:00:00 format
             */
            time: string;
            title?: string;
            imageFile?: Rev.FileUploadType;
            /** set filename/contenttype or other options for appended file */
            uploadOptions?: Rev.UploadFileOptions & {
                contentType?: 'image/gif' | 'image/jpeg' | 'image/png';
            };
        }
    }
    interface SupplementalFile {
        downloadUrl: string;
        fileId: string;
        filename?: string;
        size: number;
        title: string;
    }
    /** @deprecated - use higher level Transcription namespace */
    interface Transcription {
        downloadUrl: string;
        fileSize: number;
        filename: string;
        locale: string;
    }
    namespace Search {
        interface SuggestionOptions {
            q?: string;
        }
    }
    interface PausedVideoResponse {
        videos: PausedVideoItem[];
        totalVideos: number;
    }
    interface PausedVideoItem extends Video.SearchHit {
        sessionId: string;
        timeStamp: string;
    }
    interface WaitTranscodeOptions {
        /**
         * How often to check video status
         * @default 30
         */
        pollIntervalSeconds?: number;
        /**
         * How long to wait for transcode to complete before stopping poll loop
         * @default 240 (4 hours)
         */
        timeoutMinutes?: number;
        /**
         * callback to report current transcode progress
         */
        onProgress?: (state: Video.StatusResponse) => void;
        /**
         * callback on error getting video status
         * @default throw error immediately
         */
        onError?: (error: Error) => void | Promise<void>;
        /**
         * If true set the status of video as "Processing" until transcode completes, instead of the
         * default behavior of indicating "Ready" as soon as a playable version is available.
         * See https://revdocs.vbrick.com/docs/allow-playback-during-transcoding
         * @default {true} - set status to "Processing" until all processing jobs are complete.
         */
        ignorePlaybackWhileTranscoding?: boolean;
        /**
         * Signal to stop poll loop early
         */
        signal?: AbortSignal;
    }
    interface ClipRequest {
        /**
         * Start time of the video clip in timespan format (e.g. <code>00:00:00</code>). Minutes and seconds should be from 0-59.
         */
        start: string;
        /**
         * End time of the video clip in timespan format (e.g. <code>00:00:00</code>). Minutes and seconds should be from 0-59.
         */
        end: string;
    }
}
interface Transcription {
    downloadUrl: string;
    fileSize: number;
    filename: string;
    locale: string;
}
declare namespace Transcription {
    type SupportedLanguage = LiteralString<"da" | "de" | "el" | "en" | "en-gb" | "es" | "es-419" | "es-es" | "fi" | "fr" | "fr-ca" | "id" | "it" | "ja" | "ko" | "nl" | "no" | "pl" | "pt" | "pt-br" | "ru" | "sv" | "th" | "tr" | "zh" | "zh-tw" | "zh-cmn-hans" | "cs" | "en-au" | "hi" | "lt" | "so" | "hmn" | "my" | "cnh" | "kar" | "ku-kmr" | "ne" | "sw" | "af" | "sq" | "am" | "az" | "bn" | "bs" | "bg" | "hr" | "et" | "ka" | "ht" | "ha" | "hu" | "lv" | "ms" | "ro" | "sr" | "sk" | "sl" | "tl" | "ta" | "uk" | "vi">;
    type TranslateSource = Extract<SupportedLanguage, 'en' | 'en-gb' | 'fr' | 'de' | 'pt-br' | 'es' | 'zh-cmn-hans'>;
    type ServiceType = LiteralString<'Vbrick' | 'VoiceBase' | 'Manual'>;
    type StatusEnum = LiteralString<'NotStarted' | 'Preparing' | 'InProgress' | 'Success' | 'Failed'>;
    interface Request {
        language: Transcription.SupportedLanguage;
        audioTrack?: number;
        serviceType?: Omit<Transcription.ServiceType, 'Manual'>;
    }
    interface Status {
        videoId: string;
        transcriptionId: string;
        status: Transcription.StatusEnum;
        language: Transcription.SupportedLanguage;
        transcriptionService: Transcription.ServiceType;
    }
    interface TranslateResult {
        videoId: string;
        title: string;
        sourceLanguage: Transcription.TranslateSource;
        targetLanguages: Array<{
            language: Transcription.SupportedLanguage;
            transcriptionId: string;
            status: Transcription.StatusEnum;
        }>;
    }
}
interface ExternalAccess {
    /**
     * email address this token is associated with
     */
    email: string;
    /**
     * When this token was added (JSON date)
     */
    whenAdded: string;
    /**
     * Current status of the token.
     */
    status: LiteralString<'Active' | 'Revoked' | 'Expired'>;
    /**
     * which Rev User generated this token
     */
    grantor: string;
    /**
     * the date until this token expires
     */
    validUntil: string;
    /**
     * link to access the resource this token is associated with
     */
    link: string;
    /**
     * optional message assigned when the token was created
     */
    message: string;
}
declare namespace ExternalAccess {
    interface Request {
        /** List of email adddresses to add/remove/renew/revoke external access for */
        emails: string[];
        /**
         * Optional message - only when first adding external access
         * @default ""
         */
        message?: string;
        /**
         * Send email to each address notifying them of external access.
         * Set to `true` to disable sending emails
         * @default false
         */
        noEmail?: boolean;
    }
    interface RenewResponse {
        /**
         * Email that external access could not be renewed for.
         */
        invalidEmails: string[];
    }
}

declare namespace Admin {
    interface CustomField {
        id: string;
        name: string;
        value: string;
        required?: boolean;
    }
    namespace CustomField {
        type Request = {
            id: string;
            name?: string;
            value: string;
        } | {
            id?: string;
            name: string;
            value: string;
        };
        interface Detail {
            id: string;
            name: string;
            value: any;
            required: boolean;
            displayedToUsers: boolean;
            options: string[] | null;
            type: string;
            fieldType: string;
        }
    }
    interface BrandingSettings {
        general?: {
            PrimaryColor?: string;
            PrimaryFontColor?: string;
            AccentColor?: string;
            AccentFontColor?: string;
            LogoUri?: string;
        };
        header?: {
            BackgroundColor?: string;
            FontColor?: string;
        };
    }
    interface IQCreditsSession {
        resourceId: string;
        resourceType: string;
        title: string;
        duration: string;
        initiator: {
            userId: string;
            firstName: string;
            lastName: string;
            fullName: string;
            username: string;
        };
        creator: {
            userId: string;
            firstName: string;
            lastName: string;
            fullName: string;
            username: string;
        };
        usage: LiteralString<'Transcription' | 'Translation' | 'UserTagging' | 'MetadataGeneration'>;
        credits: number;
        languages: string[];
        when: string;
    }
    interface ExpirationRule {
        ruleId: string;
        ruleName: string;
        numberOfDays: number;
        expiryRuleType: Video.ExpiryRule;
        deleteOnExpiration: boolean;
        isDefault: boolean;
        description: string;
    }
    interface FeatureSettings {
        categoriesEnabled: boolean;
        commentsEnabled: boolean;
        customFields: Array<{
            id: string;
            name: string;
            required: boolean;
            fieldType: LiteralString<'Text' | 'Select'>;
        }>;
        defaultSearchSort: string;
        downloadsEnabled: boolean;
        expirationRules: Array<{
            id: string;
            name: string;
            ruleType: Video.ExpiryRule;
            deleteOnExpire: boolean;
            isDefault: boolean;
            numberOfDays: number;
        }>;
        facialRecognitionEnabled: boolean;
        legalHoldEnabled: boolean;
        publicVideosEnabled: boolean;
        ratingsEnabled: boolean;
        revIQTranscriptionAndTranslationEnabled: boolean;
        supplementalFilesEnabled: boolean;
        tagsEnabled: boolean;
        unlistedEnabled: boolean;
        voiceBaseEnabled: boolean;
    }
}

interface IPageResponse<T> {
    items: T[];
    done: boolean;
    total?: number;
    pageCount?: number;
    error?: Error;
}
/**
 * Interface to iterate through results from API endpoints that return results in pages.
 * Use in one of three ways:
 * 1) Get all results as an array: await request.exec() == <array>
 * 2) Get each page of results: await request.nextPage() == { current, total, items: <array> }
 * 3) Use for await to get all results one at a time: for await (let hit of request) { }
 */
declare abstract class PagedRequest<ItemType> implements Rev.ISearchRequest<ItemType> {
    current: number;
    total: number | undefined;
    done: boolean;
    options: Required<Rev.SearchOptions<ItemType>>;
    constructor(options?: Rev.SearchOptions<ItemType>);
    protected abstract _requestPage(): Promise<IPageResponse<ItemType>>;
    /**
     * Get the next page of results from API
     */
    nextPage(): Promise<Rev.SearchPage<ItemType>>;
    /**
     * update internal variables based on API response
     * @param page
     * @returns
     */
    protected _parsePage(page: IPageResponse<ItemType>): {
        current: number;
        total: number | undefined;
        done: boolean;
        error: Error | undefined;
        items: ItemType[];
    };
    /**
     * Go through all pages of results and return as an array.
     * TIP: Use the {maxResults} option to limit the maximum number of results
     *
     */
    exec(): Promise<ItemType[]>;
    [Symbol.asyncIterator](): AsyncGenerator<Awaited<ItemType>, void, unknown>;
}

declare namespace Audit {
    export interface Options<T extends Audit.Entry = Audit.Entry> extends Rev.SearchOptions<T> {
        fromDate?: string | Date;
        toDate?: string | Date;
        beforeRequest?: (request: PagedRequest<T>) => Promise<void>;
    }
    export interface Entry<EntityKey extends string = string> {
        messageKey: string;
        entityKey: EntityKey;
        entityId: string;
        when: string;
        principal: Record<string, string | null>;
        message: Record<string, any>;
        currentState: Record<string, any>;
        previousState: Record<string, any>;
    }
    export type UserAccessEntry = Entry<'Network.UserAccess'>;
    export type UserEntry = Entry<'Network.User'>;
    export type GroupEntry = Entry<'Network.Group'>;
    type DeviceKeys = 'Devices:DmeDevice' | 'Devices:EncoderDevice' | 'Devices:CustomDevice' | 'Devices:LdapConnectorDevice' | 'Devices:AkamaiDevice';
    export type DeviceEntry = Entry<DeviceKeys>;
    export type VideoEntry = Entry<'Media:Video'>;
    export type WebcastEntry = Entry<'ScheduledEvents:Webcast'>;
    export {  };
}

interface Category {
    categoryId: string;
    name: string;
    fullPath: string;
    parentCategoryId?: string | null;
    restricted?: boolean;
}
declare namespace Category {
    export type ListItem = Omit<Category, "parentCategoryId">;
    interface BaseCategory {
        categoryId: string;
        name: string;
    }
    export interface PolicyItem {
        /**
         * Id of access control entity to give access to
         */
        id: string;
        /**
         * Type of entity (user/group)
         */
        type: "User" | "Group";
        /**
         * Category role. Only managers can edit the category itself, along with its content.
         */
        itemType: "CategoryContributor" | "CategoryManager";
    }
    export interface Details {
        categoryId: string;
        name: string;
        categoryPolicyItems: PolicyItem[] | null;
        parentCategoryId: string | null;
        restricted: boolean;
    }
    export interface EditRequest {
        /**
         * Name of category to add
         */
        name: string;
        /**
         * When true, the category is restricted and only the users/groups in categoryPolicyItems may add or edit content in the category or modify the category itself.
         */
        restricted?: boolean;
        categoryPolicyItems?: PolicyItem[];
    }
    export interface CreateRequest extends EditRequest {
        /**
         * Id of parent category to add the category as a child category. If specified, the Id needs to exist in Rev.
         */
        parentCategoryId?: string;
    }
    type Parent = BaseCategory & {
        parentCategory: null | Parent;
    };
    export interface CreateResponse extends BaseCategory {
        parentCategory?: null | Parent;
    }
    export interface Assignable {
        id: string;
        name: string;
        fullPath: string;
    }
    export {  };
}

declare namespace Channel {
    interface Member {
        id: string;
        type: LiteralString<'User' | 'Group'>;
        roleTypes: LiteralString<'Admin' | 'Contributor' | 'Member'>[];
    }
    interface CreateRequest {
        name: string;
        description?: string;
        members?: Member[];
    }
    interface SearchHit {
        id: string;
        name: string;
        description: string;
        members: Member[];
    }
    interface SearchOptions {
        maxResults?: number;
        pageSize?: number;
        start?: number;
        onProgress?: (items: SearchHit[], current: number, total: number) => void;
    }
}

declare namespace Device {
    export type DeviceType = 'Dme' | 'Akamai' | 'AkamaiLive' | 'Custom' | 'Encoder';
    export type HealthStatusType = 'Uninitialized' | 'Initializing' | 'Healthy' | 'Warning' | 'Error' | 'Updating' | 'Normal' | 'Caution' | 'Alert';
    export interface VideoStream {
        name: string;
        url: string;
        encodingType: Video.EncodingType;
        isMulticast: boolean;
        isVbrickMulticast: boolean;
    }
    export interface ZoneDevice {
        deviceType: DeviceType;
        id: string;
        name: string;
        healthStatus: HealthStatusType;
        isVideoStorageDevice?: boolean;
        macAddresses?: string[];
        prepositionContent?: boolean;
        videoStreams?: VideoStream[];
    }
    export interface PresentationProfile {
        id: string;
        name: string;
        description: string;
        status: "Active" | "InActive";
        videoSource: string;
        destinations?: {
            deviceId: string;
            deviceName: string;
            type: string;
            isActive: boolean;
            streams: string[];
        }[];
    }
    export interface DmeDetails {
        name: string;
        id: string;
        macAddress: string;
        status: string;
        prepositionContent: boolean;
        isVideoStorageDevice: boolean;
        dmeStatus: DmeHealthStatus;
        ipAddress: string;
    }
    export interface CreateDMERequest {
        /**
         * DME device name
         */
        name: string;
        /**
         * MAC address for the DME. Must be unique to the Rev account.
         */
        macAddress: string;
        /**
         * Default=false. Specifies if the DME is currently active.
         */
        isActive?: boolean;
        /**
         * Default=false. Specifies if the DME should preposition content.
         */
        prepositionContent?: boolean;
        /**
         * Default=false. Specifies the DME as a storage device.
         */
        isVideoStorageDevice?: boolean;
        manualVideoStreams?: DmeVideoStream[];
        VideoStreamGroupsToAdd?: DmeVideoStreamGroup[];
    }
    /**
     * Used to manually add video streams to the DME.
     */
    interface DmeVideoStream {
        /**
         * Descriptive name for the stream
         */
        name: string;
        /**
         * URL of the stream
         */
        url: string;
        /**
         * Encoding type of the stream.  Values can be [h264, hls, hds, h264ts, mpeg4, mpeg2, wm]
         */
        encodingType?: LiteralString<Video.EncodingType>;
        /**
         * Specifies if the stream is a multicast stream
         */
        isMulticast?: boolean;
    }
    /**
     * Used to add an HLS stream, required for mobile devices.  This is not added by default.
     */
    interface DmeVideoStreamGroup {
        /**
         * Stream name
         */
        name: string;
        /**
         * Specify if an HLS stream is created
         */
        hasHls: boolean;
    }
    interface OriginStats {
        segmentsFailed: number;
        playlistsFailed: number;
        playlistsReceived: number;
        segmentsReceived: number;
    }
    type HealthEnum = "Uninitialized" | "Normal" | "Caution" | "Alert";
    interface MeshStatistics {
        clientHttpRequests?: number;
        clientHttpHits?: number;
        clientHttpErrors?: number;
        clientHttpKbitsIn?: number;
        clientHttpKbitsOut?: number;
        clientHttpAllMedianSvcTime?: number;
        clientHttpMissMedianSvcTime?: number;
        serverAllRequests?: number;
        serverAllErrors?: number;
        serverAllKbitsIn?: number;
        serverAllKbitsOut?: number;
        serverHttpRequests?: number;
        serverHttpErrors?: number;
        serverHttpKbitsIn?: number;
        serverHttpKbitsOut?: number;
        cpuTime?: number;
        hitsPercentageAllRequests?: number;
        hitsPercentageBitsSent?: number;
        memoryHitsPercentageHitRequests?: number;
        diskHitsPercentageHitRequests?: number;
        storageSwapSize?: number;
        storageSwapPercentageUsed?: number;
        storageMemSize?: number;
        storageMemPercentageUsed?: number;
        cacheMissesRatio?: number;
        cacheHits?: number;
        squidCpuUsage?: number;
    }
    interface HLSDistribution {
        streamId: string;
        streamName: string;
        mediaId: string;
        mediaName: string;
        mediaSource: string;
        mediaSourceType: string;
        status: string;
        statusDetail: string;
        sourceUrl: string;
        playlistsReceived: number;
        segmentsReceived: number;
        eventPlaylistReceived: number;
        eventSegmentsReceived: number;
        eventPlaylistFetchErrors: number;
        eventSegmentFetchErrors: number;
        streamReconnects: number;
        enableMulticast: boolean;
        enableReflection: boolean;
        automaticMulticast: "HighBitrate" | "LowBitrate";
        eventStarted: string;
    }
    interface DmeRecordingStatus {
        id: string;
        streamName: string;
        startDate: string;
        duration: string;
        status: string;
    }
    interface DmeServiceStatus {
        name: string;
        active: string;
        state: string;
        stateStartTime: string;
        memory: number;
    }
    interface EnrichedStreamStatus {
        typeNumeric?: number;
        stateStartTime?: number;
        inputStream?: string;
        totalPktsTx?: number;
        status?: string;
        totalEventTime?: number;
        mediaId?: string;
        mediaName?: string;
        packetsOk?: number;
        totalPktsDropped?: number;
        enrichmentType?: string;
        endTime?: string;
        url?: string;
        startTime?: string;
        reconnectAttempts?: number;
        typeVerbose?: string;
        packetsDropped?: number;
        name?: string;
        duration?: number;
        timeInCurrentState?: number;
        enrichmentRequestId?: string;
        connectionHistory?: {
            packetsDropped?: number;
            packetsTx?: number;
            connectionStartTime?: number;
            connectionEndTime?: number;
        }[];
    }
    interface PassthroughStreamStatus {
        reflectionData?: {
            playbackUrlPaths: {
                type: string;
                path: string;
            }[];
        };
        eventConfig?: {
            duration: number;
            mediaId: string;
            mediaSourceType: string;
            enableReflection: boolean;
            mediaName: string;
            autoMulticastConfig?: {
                packetSize: number;
                address: string;
                port: number;
                rendition: string;
            };
            enableMulticast: boolean;
            sourceUrl: string;
            streamName: string;
            streamId: string;
            mediaSource: string;
        };
        multicastPushData?: {
            rates: {
                bitrate: number;
                segmentsSent: number;
                state: string;
                playlistsSent: number;
                playbackUrl: string;
            }[];
        };
        type: string;
        originData: {
            sourceUrls?: {
                url: string;
                type: string;
            }[];
            currentStatus?: {
                stateStartTime: number;
                stateElapsedTime: number;
                state: string;
                eventElapsedTime: number;
                statsEventTotal: OriginStats;
                statsWindowed: OriginStats;
                eventStartTime: number;
                statsStateTotal: OriginStats;
            };
        };
    }
    interface HLSStreamStatus {
        masterStatus: string;
        cdn?: {
            isActive: number;
            pushUrl: string;
        };
        subStreams?: {
            url: string;
            name: string;
        }[];
        masterUrl?: string;
        groupName?: string;
        isMasterSub?: number;
    }
    interface MPSStreamStatus {
        status: string;
        packetsDropped: number;
        name: string;
        packetsOk: number;
        uptime: number;
        type: string;
        farIp: string;
        farPort: number;
        nearPort: number;
    }
    export interface DmeHealthStatus {
        bootTime?: string;
        systemTime?: string;
        systemVersion?: string;
        fullVersion?: string;
        ipAddress?: string;
        natAddress?: string;
        hostname?: string;
        overallHealth?: HealthEnum;
        cpuUsagePercent?: number;
        cpuUsageHealth?: HealthEnum;
        rtmpServerVersion?: string;
        rtspCpuUsagePercent?: number;
        rtmpCpuUsagePercent?: number;
        mpsConnectionCount?: number;
        mpsThroughputBitsPerSec?: number;
        mpsThroughputPercent?: number;
        throughputHealth?: HealthEnum;
        multiProtocolIncomingConnectionsCount?: number;
        multiProtocolOutgoingConnectionsCount?: number;
        mpsMulticastStreamCount?: number;
        multiProtocolMaxCount?: number;
        rtpIncomingConnectionsCount?: number;
        rtpOutgoingConnectionsCount?: number;
        rtpMulticastConnectionsCount?: number;
        rtpConnectionsMaxCount?: number;
        iScsiEnabled?: boolean;
        diskContentTotal?: number;
        diskContentUsed?: number;
        diskContentHealth?: HealthEnum;
        diskSystemTotal?: number;
        diskSystemUsed?: number;
        diskSystemHealth?: HealthEnum;
        physicalMemoryTotal?: number;
        physicalMemoryUsed?: number;
        swapMemoryUsed?: number;
        swapMemoryTotal?: number;
        memoryHealth?: HealthEnum;
        meshPeerTotalCount?: number;
        meshPeerReachableCount?: number;
        meshHealth?: HealthEnum;
        transratingActiveCount?: number;
        transratingMaxCount?: number;
        recordings?: DmeRecordingStatus[];
        sslMediaTransfer?: string;
        stbConnectorEnabled?: boolean;
        httpThroughputBitsPerSec: number;
        httpConnectionCount: number;
        throughputPhysicalBits: number;
        meshStatistics?: MeshStatistics;
        lockdownStatus: "Disabled" | "Unsupported" | "Locking" | "Enabled" | "Unlocking" | "Error";
        lockdownStatusDetail?: string;
        hlsDistributions?: HLSDistribution[];
        serviceStatus?: {
            servicesHealth: string;
            services?: DmeServiceStatus[];
        };
        numWorkers?: number;
        workers?: {
            workerNum: number;
            numRequests: number;
            hitsPercentage: number;
            restarts: number;
        }[];
        streamStatus?: {
            mpsStreams: MPSStreamStatus[];
            hlsStreams?: HLSStreamStatus[];
            passthroughStreams?: PassthroughStreamStatus[];
            enrichedStreams?: EnrichedStreamStatus[];
        };
    }
    export {  };
}

declare namespace Group {
    interface Details {
        groupName: string;
        groupId: string;
        roles: Role[];
    }
    interface SearchHit {
        name: string;
        id: string;
        entityType: 'Group';
    }
    interface RawSearchHit {
        Name: string;
        Id: string;
        EntityType: 'Group';
    }
    interface CreateRequest {
        name: string;
        userIds: string[];
        roleIds: string[];
    }
}

interface User {
    userId: string;
    username: string;
    email: string;
    firstname: string;
    lastname: string;
    language: string | null;
    userType: User.UserType;
    title: string | null;
    phone: string | null;
    groups: {
        id: string;
        name: string;
    }[] | null;
    roles: Role[];
    channels: {
        id: string;
        name: string;
    }[] | null;
    profileImageUri: string | null;
    permissions: User.Permissions;
    status: User.UserStatus;
}
declare namespace User {
    interface SearchHit {
        userId: string;
        email: string | null;
        entityType: 'User';
        firstname: string;
        lastname: string;
        username: string;
        profileImageUri: string;
    }
    interface RawSearchHit {
        Id: string;
        Email: string | null;
        EntityType: 'User';
        FirstName: string;
        LastName: string;
        UserName: string;
        ProfileImageUri: string;
    }
    interface Request {
        username: string;
        email?: string;
        firstname?: string;
        lastname: string;
        title?: string;
        phoneNumber?: string;
        language?: string;
        groupIds?: string[];
        roleIds?: string[];
    }
    type DetailsLookup = LiteralString<'username' | 'email' | 'userId'>;
    interface DetailsOptions extends Rev.RequestOptions {
        lookupType?: User.DetailsLookup;
    }
    interface Permissions {
        canUpload: boolean;
        canCreateEvents: boolean;
        canCreatePublicWebcasts: boolean;
        canCreateAllUsersWebcasts: boolean;
        canCreatePublicVods: boolean;
        canCreateAllUsersVods: boolean;
    }
    interface Notification {
        notificationId: string;
        notificationDate: string;
        notificationType: string;
        isRead: boolean;
        notificationText: string;
        notificationTargetUri: string;
    }
    type UserType = LiteralString<'System' | 'LDAP' | 'Sso' | 'SCIM'>;
    type UserStatus = LiteralString<'Suspended' | 'Unlicensed' | 'AwaitingConfirmation' | 'AwaitingPasswordReset' | 'AwaitingSecurityQuestionReset' | 'LockedOut' | 'Active'>;
    type LoginReportSort = LiteralString<'LastLogin' | 'Username'>;
    interface LoginReportEntry {
        Username: string;
        FullName: string;
        UserId: string;
        LastLogin: string;
    }
}

interface Playlist {
    id: string;
    name: string;
    playbackUrl: string;
    playlistType?: Playlist.PlaylistTypeEnum;
    videos?: Playlist.Video[];
    searchFilter?: Video.SearchOptions;
}
declare namespace Playlist {
    type PlaylistTypeEnum = LiteralString<'Static' | 'Dynamic'>;
    interface List {
        featuredPlaylist?: Playlist;
        playlists: Playlist[];
    }
    interface Video {
        id: string;
        title: string;
        /**
         * Added Rev 7.53
         */
        ownerFullName: string;
        ownerProfileImageUri: string;
    }
    interface UpdateAction {
        /**
         * Video Ids to edit in the playlist
         */
        videoId: string;
        /**
         * Action to be taken - Add or Remove.
         */
        action: "Add" | "Remove";
    }
    interface DetailsResponse {
        playlistId: string;
        playlistType: PlaylistTypeEnum;
        playlistDetails: Omit<Playlist, 'videos'> & {
            videos?: undefined;
        };
        videos: Video.Details[];
        scrollId?: string;
        totalVideos?: string;
    }
}

declare namespace Recording {
    interface PresentationProfileRequest {
        presentationProfileId: string;
        useAccountRecordingDevice?: boolean;
        startDate?: string | Date;
        endDate?: string | Date;
        title?: string;
    }
    interface PresentationProfileStatus {
        startDate: string;
        endDate: string;
        status: Video.StatusEnum;
    }
    interface StopPresentationProfileResponse {
        recordingVideoId: string;
        status: Video.StatusEnum;
    }
}

interface Webcast {
    id: string;
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    listingType: Webcast.WebcastAccessControl;
    eventUrl: string;
    backgroundImages: Array<{
        url: string;
        scaleSize: string;
    }>;
    categories: Array<{
        categoryId: string;
        name: string;
        fullpath: string;
    }>;
    tags: string[];
    unlisted: boolean;
    estimatedAttendees: number;
    lobbyTimeMinutes: number;
    preProduction: {
        /**
         * format: HH:MM
         */
        duration: string;
        userIds: string[];
        groupIds: string[];
    };
    shortcutName: string;
}
declare namespace Webcast {
    type WebcastAccessControl = LiteralString<'Public' | 'TrustedPublic' | 'AllUsers' | 'Private'>;
    type SortField = LiteralString<'startDate' | 'title'>;
    type VideoSourceType = LiteralString<'Capture' | 'MicrosoftTeams' | 'PresentationProfile' | 'Rtmp' | 'WebrtcSinglePresenter' | 'SipAddress' | 'WebexTeam' | 'WebexEvents' | 'WebexLiveStream' | 'Vod' | 'Zoom' | 'Pexip' | 'Producer'>;
    type RealtimeField = LiteralString<'FullName' | 'Email' | 'ZoneName' | 'StreamType' | 'IpAddress' | 'Browser' | 'OsFamily' | 'StreamAccessed' | 'PlayerDevice' | 'OsName' | 'UserType' | 'Username' | 'AttendeeType'>;
    interface ListRequest {
        after?: string | Date;
        before?: string | Date;
        sortField?: SortField;
        sortDirection?: Rev.SortDirection;
    }
    interface SearchRequest {
        startDate?: string | Date;
        endDate?: string | Date;
        /**
         * Name of the field in the event that will be used to sort the dataset in the response. Default is 'StartDate'
         */
        sortField?: SortField;
        /**
          * Sort direction of the dataset. Values supported: 'asc' and 'desc'. Default is 'asc'.
          */
        sortDirection?: Rev.SortDirection;
        /**
          * Number of records in the dataset to return per search request. Default is 100, minimum is 50 and maximum is 500.
          */
        size?: number;
        /**
          * List of custom fields to use when searching for events. All of the fields provided are concatenated as AND in the search request. The value to the property 'Value' is required.
          */
        customFields?: Admin.CustomField.Request[];
    }
    interface CreateRequest {
        title: string;
        description?: string;
        startDate: string | Date;
        endDate: string | Date;
        presentationProfileId?: string;
        vcSipAddress?: string;
        isSecureRtmp?: boolean;
        /** only valid for edit request - Specifies if the exiting RTMP based webcast URL and Key needs to be regenerated */
        regenerateRtmpUrlAndKey?: boolean;
        /**
         * If this is an MS Teams event then the URL to the MS Teams meeting.
         */
        vcMicrosoftTeamsMeetingUrl?: string;
        /** This field is required to create/edit WebexLiveStream event. */
        videoSourceType?: VideoSourceType;
        webcastType?: LiteralString<'Rev' | 'WebexEvents'>;
        webexTeam?: {
            roomId: string;
            name?: string;
        };
        zoom?: {
            meetingId: string;
            meetingPassword?: string;
        };
        vodId?: string;
        /** Internal user Id. Only required when 'WebrtcSinglePresenter' selected as a videoSourceType */
        presenterId?: string;
        eventAdminIds: string[];
        automatedWebcast?: boolean;
        closedCaptionsEnabled?: boolean;
        pollsEnabled?: boolean;
        chatEnabled?: boolean;
        questionAndAnswerEnabled?: boolean;
        userIds?: string[];
        groupIds?: string[];
        moderatorIds?: string[];
        password?: string;
        accessControl: WebcastAccessControl;
        questionOption?: string;
        presentationFileDownloadAllowed?: boolean;
        categories?: string[];
        tags?: string[];
        unlisted?: boolean;
        estimatedAttendees?: number;
        lobbyTimeMinutes?: number;
        preProduction?: {
            duration?: string;
            userIds?: string[];
            groupIds?: string[];
        };
        shortcutName?: string;
        recordingUploaderUserEmail?: string;
        recordingUploaderUserId?: string;
        disableAutoRecording?: boolean;
        hideShareUrl?: boolean;
        autoplay?: boolean;
        linkedVideoId?: string;
        autoAssociateVod?: boolean;
        redirectVod?: boolean;
        registrationFieldIds?: string[];
        customFields?: Admin.CustomField.Request[];
        liveSubtitles?: {
            sourceLanguage: string;
            translationLanguages: string[];
        };
        emailToPreRegistrants?: boolean;
        /**
         * Attendee join method. Only required when 'accesscontrol' is Public. Default is 'Registration'. When set to 'Anonymous', no attendee specific details are collected or registered.
         */
        attendeeJoinMethod?: LiteralString<'Anonymous' | 'Registration'>;
        /**
         * Internal user Ids. Only required when 'Producer' selected as a videoSourceType.
         */
        presenterIds?: string[];
        externalPresenters?: Array<{
            name: string;
            title: string;
            email: string;
        }>;
        bannerDetails?: {
            isEnabled: boolean;
            /**
             * Maximum allowed banners are five
             */
            banners: Array<Banner.Request>;
        };
        viewerIdEnabled?: boolean;
        /**
         * Default=false. If accessControl is set to Public and 'EDIT PUBLIC REG. PAGE CONSENT VERBIAGE' is enabled on the account. When true, you can customize the consent verbiage for public attendees.
         */
        isCustomConsentEnabled?: boolean;
        /**
         * If isCustomConsentEnabled is true then you can customize the consent verbiage for public attendees.
         */
        consentVerbiage?: string;
    }
    interface Details {
        eventId: string;
        title: string;
        description: string;
        startDate: string;
        endDate: string;
        presentationProfileId?: string;
        vcSipAddress?: string;
        vcMicrosoftTeamsMeetingUrl?: string;
        videoSourceType?: VideoSourceType;
        webcastType?: LiteralString<'Rev' | 'WebexEvents'>;
        webexTeam?: {
            roomId: string;
            name?: string;
        };
        zoom?: {
            meetingId: string;
            meetingPassword?: string;
        };
        vodId?: string;
        rtmp?: {
            url: string;
            key: string;
        };
        liveSubtitles?: {
            sourceLanguage: string;
            translationLanguages: string[];
        };
        eventAdminIds: string[];
        primaryHostId: string;
        automatedWebcast: boolean;
        closedCaptionsEnabled: boolean;
        pollsEnabled: boolean;
        chatEnabled: boolean;
        questionOption: string;
        questionAndAnswerEnabled: boolean;
        userIds: string[];
        groupIds: string[];
        moderatorIds: string[];
        password: string;
        accessControl: WebcastAccessControl;
        categories: Array<{
            categoryId: string;
            name: string;
            fullpath: string;
        }>;
        tags?: string[];
        unlisted: boolean;
        estimatedAttendees: number;
        lobbyTimeMinutes: number;
        preProduction?: {
            duration: string;
            userIds: string[];
            groupIds: string[];
        };
        shortcutName: string;
        shortcutNameUrl: string;
        linkedVideoId: string;
        autoAssociateVod: boolean;
        redirectVod: boolean;
        recordingUploaderUserId: string;
        disableAutoRecording?: boolean;
        hideShareUrl?: boolean;
        autoplay?: boolean;
        presentationFileDownloadAllowed: boolean;
        registrationFields: RegistrationField[];
        customFields?: Admin.CustomField[];
        emailToPreRegistrants?: boolean;
        attendeeJoinMethod: LiteralString<'Anonymous' | 'Registration'>;
        bannerDetails?: {
            isEnabled: boolean;
            banners: Banner[];
        };
        viewerIdEnabled: boolean;
        externalPresenters: Array<{
            name: string;
            title: string;
            email: string;
        }>;
        producerBgImages?: Array<{
            imageId: string;
            imageUrls: Array<{
                url: string;
                scaleSize: string;
            }>;
        }>;
        isCustomConsentEnabled?: boolean;
        consentVerbiage?: string;
    }
    interface EditAttendeesRequest {
        userIds?: string[];
        usernames?: string[];
        groupIds?: string[];
    }
    interface PostEventSummary {
        hostCount?: number;
        moderatorCount?: number;
        attendeeCount?: number;
        experiencedRebufferingPercentage?: number;
        averageExperiencedRebufferDuration?: number;
        experiencedErrorsPerAttendees?: number;
        multicastErrorsPerAttendees?: number;
        totalSessions?: number;
        totalPublicCDNTime?: string;
        totalECDNTime?: string;
    }
    interface PostEventSession {
        userType: string;
        name: string;
        username: string;
        email: string;
        ipAddress: string;
        browser: string;
        deviceType: string;
        zone: string;
        deviceAccessed: string;
        streamAccessed: string;
        sessionTime: string;
        viewingTime: string;
        publicCDNTime?: string;
        eCDNTime?: string;
        enteredDate: string;
        exitedDate: string;
        viewingStartTime: string;
        experiencedErrors: number;
        multicastErrorsPerAttendees: number;
        bufferEvents: number;
        rebufferEvents: number;
        rebufferDuration: number;
        attendeeType: LiteralString<'Host' | 'Moderator' | 'AccountAdmin' | 'Attendee'>;
    }
    interface RealtimeRequest {
        sortField?: RealtimeField;
        sortDirection?: Rev.SortDirection;
        count?: number;
        q?: string;
        searchField?: RealtimeField;
        runNumber?: number;
        status?: LiteralString<'All' | 'Online' | 'Offline'>;
        attendeeDetails?: LiteralString<'Base' | 'All' | 'Counts'>;
    }
    interface RealtimeSummary {
        totalSessions?: number;
        hostCount?: number;
        moderatorCount?: number;
        attendeeCount?: number;
        status?: LiteralString<'Active' | 'Initiated'>;
        experiencedRebufferingPercentage?: number;
        averageExperiencedRebufferDuration?: number;
        experiencedErrorsPerAttendees?: number;
        multicastErrorsPerAttendees?: number;
    }
    interface RealtimeSession {
        userId: string;
        username: string;
        fullName: string;
        email: string;
        startTime: string;
        sessionId: string;
    }
    interface RealtimeSessionDetail extends RealtimeSession {
        userType: string;
        attendeeType: LiteralString<'Host' | 'Moderator' | 'AccountAdmin' | 'Attendee'>;
        status: LiteralString<'Online' | 'Offline'>;
        experiencedErrors: number;
        multicastFailovers: number;
        experiencedBufferingDuration: number;
        experiencedBufferingCount: number;
        avgExperiencedBufferingDuration: number;
        avgBitrateKbps: number;
        avgBandwidthMbps: number;
        viewingStartTime: number;
        zoneId: string;
        zoneName: string;
        ipAddress: string;
        streamDevice: string;
        streamAccessed: string;
        playerDevice: string;
        browser: string;
        videoPlayer: string;
        videoFormat: string;
        userAgent: string;
        osName: string;
        osFamily: string;
        deviceId: string;
        revConnect: boolean;
        streamType: string;
        sessionId: string;
        profileImageUrl: string;
    }
    interface Question {
        questionId: string;
        whenAsked: string;
        question: string;
        userName: string;
        repliedUserName: string | null;
        whenReplied: string | null;
        askedBy: string;
        repliedBy: string;
        lastAction: string;
        reply: string;
        isPublic: boolean;
    }
    interface PollResults {
        question: string;
        totalResponses: number;
        totalNoResponses: number;
        allowMultipleAnswers: boolean;
        whenPollCreated: string;
        pollAnswers: Array<{
            answer: string;
            votes: 0;
        }>;
    }
    interface Comment {
        username: string;
        date: string;
        comment: string;
        htmlComment: string;
    }
    interface Status {
        eventTitle: string;
        startDate: string;
        endDate: string;
        status: LiteralString<'Completed' | 'Scheduled' | 'Starting' | 'InProgress' | 'Broadcasting' | 'Deleted' | 'Recording' | 'RecordingStarting' | 'RecordingStopping' | 'VideoSourceStarting'>;
        slideUrl: string;
        isPreProduction: boolean;
    }
    interface PlaybackUrlRequest {
        ip?: string;
        userAgent?: string;
    }
    interface PlaybackUrlsResponse extends Video.PlaybackUrlsResponse {
    }
    interface Playback extends Video.PlaybackUrlResult {
    }
}
interface GuestRegistration {
    name: string;
    email: string;
    registrationId: string;
    registrationFieldsAnswers: Array<{
        id: string;
        name: string;
        value: string;
    }>;
}
declare namespace GuestRegistration {
    interface Details extends GuestRegistration {
        token: string;
    }
    interface Request {
        name: string;
        email: string;
        registrationFieldsAnswers?: Array<{
            id?: string;
            name?: string;
            value: string;
        }>;
    }
    interface SearchRequest {
        sortField?: LiteralString<'name' | 'email'>;
        sortDirection?: Rev.SortDirection;
        size?: number;
    }
}
interface Banner {
    id: string;
    /** Provides a description of the banner for the attendee. */
    name: string;
    /** The message that displays in the banner. */
    message: string;
    /** The link/URL that opens when clicked in the banner. */
    link?: string;
    /** Only pushMethod == Manual type banners are enabled/disabled. At end banners appear when the webcast ends. */
    isEnabled?: boolean;
    pushMethod: LiteralString<'Manual' | 'AtEnd'>;
}
declare namespace Banner {
    type Request = Omit<Banner, 'id'>;
}

interface Zone {
    id: string;
    parentZoneId?: string | null;
    name: string;
    supportsMulticast: boolean;
    ipAddresses?: string[];
    ipAddressRanges?: Array<{
        start: string;
        end: string;
    }>;
    targetDevices: Zone.TargetDevice[];
    childZones?: Zone[];
    slideDelay?: {
        overrideAccount: boolean;
        isEnabled: boolean;
        delaySeconds: number;
    };
    revConnectEnabled?: boolean;
    revConnectSetting?: null | {
        disableFallback: boolean;
        maxZoneMeshes: number;
        groupPeersByZoneIPAddresses: boolean;
        useUls: boolean;
        revConnectConfig?: null | Record<string, any>;
    };
    rendition?: {
        highBitrate: boolean;
        midBitrate: boolean;
        lowBitrate: boolean;
    };
    fallbackToSource: boolean;
}
declare namespace Zone {
    interface CreateRequest {
        id?: string;
        parentZoneId?: string;
        ipAddresses?: string[];
        ipAddressRanges?: Array<{
            start: string;
            end: string;
            cidr?: string;
        } | {
            start?: string;
            end?: string;
            cidr: string;
        }>;
        targetDevices?: TargetDeviceRequest[];
        supportsMulticast?: boolean;
        overrideAccountSlideDelay?: boolean;
        slideDelaySeconds?: number;
        revConnectEnabled?: boolean;
        revConnectSetting?: {
            /**
             * Disables fallback to a unicast stream (if available) which means the zone only supports multicast or Rev Connect.
             */
            disableFallback?: boolean;
            /**
              * 0; Defines the upper limit of what can be used within the zone based on licensing retrictions.
              */
            maxZoneMeshes?: number;
            groupPeersByZoneIPAddresses?: boolean;
            useUls?: boolean;
        };
        /**
         * Rendition selection for Auto Unicast of Cloud Streams in zone. All bitrates are seleced by default. All bitrates must be selected if any zone device is a DME that has version lower than 3.28.
         */
        zoneRendition?: {
            highBitrate: boolean;
            midBitrate: boolean;
            lowBitrate: boolean;
        };
        /**
         * Allow viewers, if distribution modalities fail, to fallback to Source (if available) for unicast playback."
         */
        fallbackToSource?: boolean;
    }
    interface TargetDevice {
        /**
         * Possible settings can be 'Custom', 'Encoder', 'Dme', 'Akamai'
         */
        deviceType: 'Custom' | 'Encoder' | 'Dme' | 'Akamai';
        /**
         * Device Id of target device
         */
        deviceId: string;
        /**
         * Status of target device
         */
        isActive: boolean;
        /**
         * Specifies if no VOD videos retrieved if true
         */
        liveOnly: boolean;
        /**
         * Rev stream names added to the zone from this device
         */
        streams: string[];
    }
    interface TargetDeviceRequest {
        /**
         * Possible settings can be 'Custom', 'Encoder', 'Dme', 'Akamai'
         */
        deviceType: 'Custom' | 'Encoder' | 'Dme' | 'Akamai';
        /**
          * Device Id of target device
          */
        deviceId: string;
        /**
          * Status of target device
          */
        isActive?: boolean;
        /**
          * Specifies if no VOD videos retrieved if true
          */
        liveOnly?: boolean;
        /**
          * Rev stream names added to the zone from this device
          */
        streams: string[];
    }
    type FlatZone = Omit<Zone, 'childZones'>;
}

interface Role {
    id: string;
    name: Role.RoleType;
}
declare namespace Role {
    type RoleType = LiteralString<'AccountAdmin' | 'MediaAdmin' | 'EventAdmin' | 'EventHost' | 'InternalEventHost' | 'MediaContributor' | 'InternalMediaContributor' | 'MediaViewer' | 'TeamCreator' | 'CategoryCreator' | 'VodAnalyst' | 'EventAnalyst' | 'RevIqUser' | 'ChannelCreator'>;
    type RoleName = LiteralString<'Account Admin' | 'Media Admin' | 'Media Contributor' | 'Media Viewer' | 'Event Admin' | 'Event Host' | 'Channel Creator' | 'Category Creator' | 'Internal Event Host' | 'Internal Media Contributor' | 'VOD Analyst' | 'Event Analyst' | 'Rev IQ User'>;
    interface Details {
        id: string;
        name: string;
        description: string;
        roleType: Role.RoleType;
    }
}
interface RegistrationField {
    id: string;
    name: string;
    fieldType: LiteralString<'Text' | 'Select'>;
    required: boolean;
    options?: string[];
    includeInAllWebcasts: boolean;
}
declare namespace RegistrationField {
    interface Request {
        name: string;
        /** @default: text */
        fieldType?: LiteralString<'Text' | 'Select'>;
        /** @default: false */
        required?: boolean;
        options?: string[];
        includeInAllWebcasts?: boolean;
    }
}

declare class AuditRequest<T extends Audit.Entry> extends PagedRequest<T> {
    options: Required<Omit<Audit.Options<T>, 'toDate' | 'fromDate'>>;
    private params;
    private _req;
    constructor(rev: RevClient, endpoint: string, label?: string, { toDate, fromDate, beforeRequest, ...options }?: Audit.Options<T>);
    protected _requestPage(): Promise<IPageResponse<T>>;
    private _buildReqFunction;
    private _parseDates;
}

declare function auditAPIFactory(rev: RevClient, optRateLimits?: Rev.Options['rateLimits']): {
    /**
    * Logs of user login / logout / failed login activity
    */
    accountAccess(accountId: string, options?: Audit.Options<Audit.UserAccessEntry>): AuditRequest<Audit.UserAccessEntry>;
    userAccess(userId: string, accountId: string, options?: Audit.Options<Audit.UserAccessEntry>): AuditRequest<Audit.UserAccessEntry>;
    /**
    * Operations on User Records (create, delete, etc)
    */
    accountUsers(accountId: string, options?: Audit.Options<Audit.UserEntry>): AuditRequest<Audit.UserEntry>;
    user(userId: string, accountId: string, options?: Audit.Options<Audit.UserEntry>): AuditRequest<Audit.UserEntry>;
    /**
    * Operations on Group Records (create, delete, etc)
    */
    accountGroups(accountId: string, options?: Audit.Options<Audit.GroupEntry>): AuditRequest<Audit.GroupEntry>;
    group(groupId: string, accountId: string, options?: Audit.Options<Audit.GroupEntry>): AuditRequest<Audit.GroupEntry>;
    /**
    * Operations on Device Records (create, delete, etc)
    */
    accountDevices(accountId: string, options?: Audit.Options<Audit.DeviceEntry>): AuditRequest<Audit.DeviceEntry>;
    device(deviceId: string, accountId: string, options?: Audit.Options<Audit.DeviceEntry>): AuditRequest<Audit.DeviceEntry>;
    /**
    * Operations on Video Records (create, delete, etc)
    */
    accountVideos(accountId: string, options?: Audit.Options<Audit.VideoEntry>): AuditRequest<Audit.VideoEntry>;
    video(videoId: string, accountId: string, options?: Audit.Options<Audit.VideoEntry>): AuditRequest<Audit.VideoEntry>;
    /**
    * Operations on Webcast Records (create, delete, etc)
    */
    accountWebcasts(accountId: string, options?: Audit.Options<Audit.WebcastEntry>): AuditRequest<Audit.WebcastEntry>;
    webcast(eventId: string, accountId: string, options?: Audit.Options<Audit.WebcastEntry>): AuditRequest<Audit.WebcastEntry>;
    /**
    * All operations a single user has made
    */
    principal(userId: string, accountId: string, options?: Audit.Options<Audit.Entry<string>>): AuditRequest<Audit.Entry<string>>;
};

/**
 * Constructs the query parameters for the Rev /oauth/authorization endpoint
 * @param config OAuth signing settings, retrieved from Rev Admin -> Security -> API Keys page, along with revUrl
 * @param state optional state to pass back to redirectUri once complete
 * @returns A valid oauth flow endpoint + query
 */
declare function buildLegacyOAuthQuery(config: OAuth.Config, oauthSecret: string, state?: string): Promise<{
    apiKey: string;
    signature: string;
    verifier: string;
    redirect_uri: string;
    response_type: string;
    state: string;
}>;
/**
 * Parse the query parameters returned to the redirectUri from Rev
 * @param url The URL with query parameters, or object with the query parrameters
 * @returns
 */
declare function parseLegacyOAuthRedirectResponse(url: string | URL | URLSearchParams | Record<string, string>): OAuth.RedirectResponse;

declare function authAPIFactory(rev: RevClient): {
    loginToken(apiKey: string, secret: string, options?: Rev.RequestOptions): Promise<Auth.LoginResponse>;
    extendSessionToken(apiKey: string): Promise<Auth.ExtendResponse>;
    logoffToken(apiKey: string): Promise<void>;
    loginUser(username: string, password: string, options?: Rev.RequestOptions): Promise<Auth.UserLoginResponse>;
    logoffUser(userId: string): Promise<void>;
    extendSessionUser(userId: string): Promise<Auth.ExtendResponse>;
    loginJWT(jwtToken: string, options?: Rev.RequestOptions): Promise<Auth.JWTLoginResponse>;
    loginGuestRegistration(webcastId: string, jwtToken: string, options?: Rev.RequestOptions): Promise<Auth.GuestRegistrationResposne>;
    extendSession(): Promise<Auth.ExtendResponse>;
    verifySession(): Promise<void>;
    /**
     * @deprecated - use logoffUser - put here because it's a common misspelling
     */
    readonly logoutUser: (userId: string) => Promise<void>;
    /**
     * @deprecated - use logoffToken - put here because it's a common misspelling
     */
    readonly logoutToken: (apiKey: string) => Promise<void>;
    /**
     * generate the Authorization URL for the OAuth2 flow as well as the codeVerifier for the
     * subsequent Access Token request. You *must* store the codeVerifier somehow (i.e. serverside database matched to user's state/cookies/session, or on browser SessionStorage) to be able to complete the OAuth2 login flow.
     * @param config OAuth signing settings, retrieved from Rev Admin -> Security -> API Keys page
     * @param oauthSecret Secret from Rev Admin -> Security. This is a DIFFERENT value from the
     *                    User Secret used for API login. Do not expose client-side!
     * @param state optional state to pass back to redirectUri once complete
     * @param verifier the code_verifier to use when generating the code challenge. Can be any string 43-128 characters in length, just these characters: [A-Za-z0-9._~-]. If not provided then code will automatically generate a suitable value
     * @returns A valid oauth flow URL + the code_verifier to save for later verification
     */
    buildOAuth2Authentication(config: OAuth.ServerConfig, state?: string, verifier?: string): Promise<OAuth.AuthenticationData>;
    loginOAuth2(config: OAuth.Config, code: string, codeVerifier: string, options?: Rev.RequestOptions): Promise<OAuth.AuthTokenResponse>;
    /**
     * @deprecated
     * @param config OAuth signing settings, retrieved from Rev Admin -> Security -> API Keys page
     * @param oauthSecret Secret from Rev Admin -> Security. This is a DIFFERENT value from the
     *                    User Secret used for API login. Do not expose client-side!
     * @param state optional state to pass back to redirectUri once complete
     * @returns A valid oauth flow URL
     */
    buildOAuthAuthenticationURL(config: OAuth.Config, oauthSecret: string, state?: string): Promise<string>;
    /**
     * @deprecated
     */
    buildOAuthAuthenticationQuery: typeof buildLegacyOAuthQuery;
    /**
     * @deprecated
     */
    parseOAuthRedirectResponse: typeof parseLegacyOAuthRedirectResponse;
    /**
     * @deprecated
     * @param config
     * @param authCode
     * @returns
     */
    loginOAuth(config: OAuth.Config, authCode: string): Promise<OAuth.LoginResponse>;
    /**
     * @deprecated
     * @param config
     * @param refreshToken
     * @returns
     */
    extendSessionOAuth(config: OAuth.Config, refreshToken: string): Promise<OAuth.LoginResponse>;
};

declare function categoryAPIFactory(rev: RevClient): {
    create(category: Category.CreateRequest): Promise<Category.CreateResponse>;
    details(categoryId: string): Promise<Category.Details>;
    update(categoryId: string, category: Category.EditRequest): Promise<void>;
    delete(categoryId: string): Promise<void>;
    /**
     * get list of categories in system
     * @see {@link https://revdocs.vbrick.com/reference#getcategories}
     */
    list(parentCategoryId?: string, includeAllDescendants?: boolean): Promise<Category[]>;
    /**
     * get list of categories that current user has ability to add videos to
     */
    listAssignable(): Promise<Category.Assignable[]>;
};

/**
 * Interface to iterate through results from API endpoints that return results in pages.
 * Use in one of three ways:
 * 1) Get all results as an array: await request.exec() == <array>
 * 2) Get each page of results: await request.nextPage() == { current, total, items: <array> }
 * 3) Use for await to get all results one at a time: for await (let hit of request) { }
 */
declare class SearchRequest<T> extends PagedRequest<T> {
    options: Required<Rev.SearchOptions<T>>;
    private query;
    private _reqImpl;
    constructor(rev: RevClient, searchDefinition: Rev.SearchDefinition<T>, query?: Record<string, any>, options?: Rev.SearchOptions<T>);
    protected _requestPage(): Promise<IPageResponse<T>>;
    private _buildReqFunction;
}

declare function channelAPIFactory(rev: RevClient): {
    create(channel: Channel.CreateRequest): Promise<string>;
    update(channelId: string, channel: Channel.CreateRequest): Promise<void>;
    delete(channelId: string): Promise<void>;
    /**
     * get list of channels in system
     * @see {@link https://revdocs.vbrick.com/reference/getchannels}
     */
    list(start?: number, options?: Channel.SearchOptions): ChannelListRequest;
    addMembers(channelId: string, members: Channel.Member[]): Promise<void>;
    removeMembers(channelId: string, members: Array<string | Channel.Member>): Promise<void>;
    /**
     *
     * @param {string} [searchText]
     * @param {Rev.SearchOptions<{Id: string, Name: string}>} [options]
     */
    search(searchText?: string, options?: Rev.AccessEntitySearchOptions<AccessControl.SearchHit> & {
        type?: AccessControl.EntitySearchType;
    }): SearchRequest<AccessControl.SearchHit>;
};
declare class ChannelListRequest implements Rev.ISearchRequest<Channel.SearchHit> {
    currentPage: number;
    current: number;
    total: number;
    done: boolean;
    options: Required<Pick<Channel.SearchOptions, 'maxResults' | 'onProgress' | 'pageSize'>>;
    private _req;
    constructor(rev: RevClient, start?: number, options?: Channel.SearchOptions);
    nextPage(): Promise<{
        current: number;
        total: number;
        done: boolean;
        items: Channel.SearchHit[];
    }>;
    /**
     * Go through all pages of results and return as an array.
     * TIP: Use the {maxResults} option to limit the maximum number of results
     *
     */
    exec(): Promise<Channel.SearchHit[]>;
    [Symbol.asyncIterator](): AsyncGenerator<Channel.SearchHit, void, unknown>;
}

declare function deviceAPIFactory(rev: RevClient): {
    listDMEs(): Promise<Device.DmeDetails[]>;
    listZoneDevices(): Promise<Device.ZoneDevice[]>;
    listPresentationProfiles(): Promise<Device.PresentationProfile[]>;
    add(dme: Device.CreateDMERequest): Promise<any>;
    healthStatus(deviceId: string): Promise<Device.DmeHealthStatus>;
    delete(deviceId: string): Promise<void>;
    rebootDME(deviceId: string): Promise<any>;
};

declare function groupAPIFactory(rev: RevClient): {
    /**
     * Create a group. Returns the resulting Group ID
     * @param {{name: string, userIds: string[], roleIds: string[]}} group
     * @returns {Promise<string>}
     */
    create(group: Group.CreateRequest): Promise<any>;
    delete(groupId: string): Promise<void>;
    details(groupId: string): Promise<Group.Details>;
    /**
     *
     * @param {string} [searchText]
     * @param {Rev.SearchOptions<{Id: string, Name: string}>} [options]
     */
    search(searchText?: string, options?: Rev.AccessEntitySearchOptions<Group.SearchHit>): SearchRequest<Group.SearchHit>;
    list(options?: Rev.SearchOptions<Group.SearchHit>): SearchRequest<Group.SearchHit>;
    listUsers(groupId: string, options?: Rev.SearchOptions<string>): SearchRequest<string>;
    /**
     * get all users in a group with full details
     * @param groupId
     * @param options
     * @returns
     */
    listUserDetails(groupId: string, options?: Rev.SearchOptions<User & {
        error?: Error;
    }>): SearchRequest<User & {
        userId: string;
        error?: Error;
    }>;
};

declare class PlaylistDetailsRequest extends SearchRequest<Video.Details> {
    playlist: Playlist & Omit<Playlist.DetailsResponse, 'scrollId'>;
    get playlistName(): string;
    get searchFilter(): Video.SearchOptions | undefined;
    constructor(rev: RevClient, playlistId: string, query?: {
        count?: number;
    }, options?: Rev.SearchOptions<Video.Details>);
    getPlaylistInfo(): Promise<{
        videos: Video.Details[];
        playlistName: string;
        searchFilter: Video.SearchOptions | undefined;
        id: string;
        name: string;
        playbackUrl: string;
        playlistType: (string & Record<never, never>) | "Static" | "Dynamic";
        playlistId: string;
        playlistDetails: Omit<Playlist, "videos"> & {
            videos?: undefined;
        };
        totalVideos?: string | undefined;
    }>;
}

declare function playlistAPIFactory(rev: RevClient): {
    create(name: string, videos: string[] | Video.SearchOptions): Promise<string>;
    details(playlistId: string, query: {
        count?: number;
    }): Promise<Playlist.DetailsResponse>;
    listVideos(playlistId: string, query: {
        count?: number;
    }, options?: Rev.SearchOptions<Video.Details>): PlaylistDetailsRequest;
    update(playlistId: string, actions: Playlist.UpdateAction[] | Video.SearchOptions): Promise<void>;
    updateFeatured(actions: Playlist.UpdateAction[]): Promise<void>;
    delete(playlistId: string): Promise<void>;
    /**
     * get list of playlists in system.
     * NOTE: return type is slightly different than API documentation
     * @see {@link https://revdocs.vbrick.com/reference#getplaylists}
     */
    list(): Promise<Playlist.List>;
};

declare function recordingAPIFactory(rev: RevClient): {
    startVideoConferenceRecording(sipAddress: string, sipPin: string, title?: string): Promise<string>;
    getVideoConferenceStatus(videoId: string): Promise<Video.StatusEnum>;
    stopVideoConferenceRecording(videoId: string): Promise<string>;
    startPresentationProfileRecording(request: Recording.PresentationProfileRequest): Promise<string>;
    getPresentationProfileStatus(recordingId: string): Promise<Recording.PresentationProfileStatus>;
    stopPresentationProfileRecording(recordingId: string): Promise<Recording.StopPresentationProfileResponse>;
};

type PresentationChaptersOptions = Rev.RequestOptions & Rev.UploadFileOptions & {
    contentType?: 'application/vnd.ms-powerpoint' | 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
};
type TranscriptionOptions = Rev.RequestOptions & Rev.UploadFileOptions & {
    contentType?: 'text/plain' | 'application/x-subrip';
};
type SupplementalOptions = Rev.RequestOptions & Omit<Rev.UploadFileOptions, 'filename' | 'contentLength'> & {
    contentType?: 'application/x-7z-compressed' | 'text/csv' | 'application/msword' | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' | 'image/gif' | 'image/jpeg' | 'application/pdf' | 'image/png' | 'application/vnd.ms-powerpoint' | 'application/vnd.openxmlformats-officedocument.presentationml.presentation' | 'application/x-rar-compressed' | 'image/svg+xml' | 'text/plain' | 'application/vnd.ms-excel' | 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' | 'application/zip';
};
declare function uploadAPIFactory(rev: RevClient): {
    /**
     * Upload a video, and returns the resulting video ID
     */
    video(file: Rev.FileUploadType, metadata?: Video.UploadMetadata, options?: Rev.UploadFileOptions): Promise<string>;
    replaceVideo(videoId: string, file: Rev.FileUploadType, options?: Rev.UploadFileOptions): Promise<void>;
    transcription(videoId: string, file: Rev.FileUploadType, language?: Transcription.SupportedLanguage, options?: TranscriptionOptions): Promise<void>;
    supplementalFile(videoId: string, file: Rev.FileUploadType, options?: SupplementalOptions): Promise<void>;
    /**
     *
     * @param videoId id of video to add chapters to
     * @param chapters list of chapters. Must have time value and one of title or imageFile
     * @param action replace = POST/replace existing with this payload
     *               append = PUT/add or edit without removing existing
     * @param options  additional upload + request options
     */
    chapters(videoId: string, chapters: Video.Chapter.Request[], action?: "append" | "replace", options?: Rev.RequestOptions): Promise<void>;
    thumbnail(videoId: string, file: Rev.FileUploadType, options?: Rev.RequestOptions & Rev.UploadFileOptions): Promise<void>;
    presentationChapters(videoId: string, file: Rev.FileUploadType, options?: PresentationChaptersOptions): Promise<void>;
};

declare function userAPIFactory(rev: RevClient): {
    /**
     * get the list of roles available in the system (with role name and id)
     */
    readonly roles: (cache?: boolean | "Force") => Promise<Role.Details[]>;
    /**
     * Create a new User in Rev
     * @param user
     * @returns the User ID of the created user
     */
    create(user: User.Request): Promise<string>;
    delete(userId: string): Promise<void>;
    details: {
        (userId: string, options?: User.DetailsOptions): Promise<User>;
        (username: string, type: "username"): Promise<User>;
        (email: string, type: "email"): Promise<User>;
    };
    /**
     * Use the Details API to get information about currently logged in user
     * @param requestOptions
     */
    profile(requestOptions?: Rev.RequestOptions): Promise<User>;
    /**
     * get user details by username
     * @deprecated - use details(username, {lookupType: 'username'})
     */
    getByUsername(username: string): Promise<User>;
    /**
     * get user details by email address
     * @deprecated - use details(email, 'email')
     */
    getByEmail(email: string): Promise<User>;
    /**
     * Check if user exists in the system. Instead of throwing on a 401/403 error if
     * user does not exist it returns false. Returns user details if does exist,
     * instead of just true
     * @param userLookupValue userId, username, or email
     * @param type
     * @returns User if exists, otherwise false
     */
    exists(userLookupValue: string, type?: User.DetailsLookup): Promise<User | false>;
    /**
     * use PATCH API to add user to the specified group
     * https://revdocs.vbrick.com/reference#edituserdetails
     * @param {string} userId id of user in question
     * @param {string} groupId
     * @returns {Promise<void>}
     */
    addToGroup(userId: string, groupId: string): Promise<void>;
    /**
     * use PATCH API to add user to the specified group
     * https://revdocs.vbrick.com/reference#edituserdetails
     * @param {string} userId id of user in question
     * @param {string} groupId
     * @returns {Promise<void>}
     */
    removeFromGroup(userId: string, groupId: string): Promise<void>;
    suspend(userId: string): Promise<void>;
    unsuspend(userId: string): Promise<void>;
    /**
     * search for users based on text query. Leave blank to return all users.
     *
     * @param {string} [searchText]
     * @param {Rev.SearchOptions<{Id: string, Name: string}>} [options]
     */
    search(searchText?: string, options?: Rev.AccessEntitySearchOptions<User.SearchHit>): Rev.ISearchRequest<User.SearchHit>;
    /**
     * Returns the channel and category subscriptions for the user making the API call.
     */
    listSubscriptions(): Promise<{
        categories: string[];
        channels: string[];
    }>;
    subscribe(id: string, type: LiteralString<"Channel" | "Category">): Promise<void>;
    /**
     * Unsubscribe from specific channel or category.
     */
    unsubscribe(id: string, type: LiteralString<"Channel" | "Category">): Promise<void>;
    getNotifications(unread?: boolean): Promise<{
        count: number;
        notifications: User.Notification[];
    }>;
    /**
     *
     * @param notificationId If notificationId not provided, then all notifications for the user are marked as read.
     */
    markNotificationRead(notificationId?: string): Promise<void>;
    loginReport(sortField?: User.LoginReportSort, sortOrder?: Rev.SortDirection): Promise<User.LoginReportEntry[]>;
};

declare function parseOptions(options: Video.VideoReportOptions): {
    maxResults?: number;
    onProgress?: ((items: Video.VideoReportEntry[], current: number, total?: number | undefined) => void) | undefined;
    onError?: (err: Error | ScrollError) => void;
    onScrollError?: (err: ScrollError) => void;
    signal?: AbortSignal | undefined;
    startDate: Date;
    endDate: Date;
    incrementDays: number;
    sortDirection: Rev.SortDirection;
    videoIds: string | undefined;
};
declare class VideoReportRequest extends PagedRequest<Video.VideoReportEntry> {
    options: Required<ReturnType<typeof parseOptions>>;
    private _rev;
    private _endpoint;
    constructor(rev: RevClient, options?: Video.VideoReportOptions, endpoint?: string);
    protected _requestPage(): Promise<{
        items: Video.VideoReportEntry[];
        done: boolean;
    }>;
    get startDate(): Date;
    set startDate(value: Date);
    get endDate(): Date;
    set endDate(value: Date);
}

type VideoSearchDetailedItem = Video.SearchHit & (Video.Details | {
    error?: Error;
});
declare function videoAPIFactory(rev: RevClient): {
    /**
     * @deprecated Use edit() API instead
     */
    trim(videoId: string, removedSegments: Array<{
        start: string;
        end: string;
    }>): Promise<any>;
    convertDualStreamToSwitched(videoId: string): Promise<void>;
    edit(videoId: string, keepRanges: Video.ClipRequest[], options?: Rev.RequestOptions): Promise<any>;
    patch(videoId: string, operations: Rev.PatchOperation[], options?: Rev.RequestOptions): Promise<void>;
    generateMetadata(videoId: string, fields?: Video.MetadataGenerationField[], options?: Rev.RequestOptions): Promise<void>;
    generateMetadataStatus(videoId: string, options?: Rev.RequestOptions): Promise<Video.MetadataGenerationStatus>;
    transcribe(videoId: string, language: Transcription.SupportedLanguage | Transcription.Request, options?: Rev.RequestOptions): Promise<Transcription.Status>;
    transcriptionStatus(videoId: string, transcriptionId: string, options?: Rev.RequestOptions): Promise<Transcription.Status>;
    translate(videoId: string, source: Transcription.TranslateSource, target: Transcription.SupportedLanguage | Transcription.SupportedLanguage[], options?: Rev.RequestOptions): Promise<Transcription.TranslateResult>;
    getTranslationStatus(videoId: string, language: Transcription.SupportedLanguage, options?: Rev.RequestOptions): Promise<Transcription.StatusEnum>;
    deleteTranscription(videoId: string, language?: Transcription.SupportedLanguage | Transcription.SupportedLanguage[], options?: Rev.RequestOptions): Promise<void>;
    /**
     * Helper - update the audio language for a video. If index isn't specified then update the default language
     * @param video - videoId or video details (from video.details api call)
     * @param language - language to use, for example 'en'
     * @param trackIndex - index of audio track - if not supplied then update default or first index
     * @param options
     */
    setAudioLanguage(video: string | Video.Details, language: Transcription.SupportedLanguage, trackIndex?: number, options?: Rev.RequestOptions): Promise<void>;
    /**
     * Helper - wait for video transcode to complete.
     * This doesn't indicate that a video is playable, rather that all transcoding jobs are complete
     * @param videoId
     * @param options
     */
    waitTranscode(videoId: string, options?: Video.WaitTranscodeOptions, requestOptions?: Rev.RequestOptions): Promise<Video.StatusResponse>;
    listExternalAccess(videoId: string, q?: string, options?: Rev.SearchOptions<ExternalAccess>): Rev.ISearchRequest<ExternalAccess>;
    createExternalAccess(videoId: string, request: ExternalAccess.Request): Promise<void>;
    renewExternalAccess(videoId: string, request: Pick<ExternalAccess.Request, "emails" | "noEmail">): Promise<ExternalAccess.RenewResponse>;
    deleteExternalAccess(videoId: string, request: Pick<ExternalAccess.Request, "emails">): Promise<void>;
    revokeExternalAccess(videoId: string, request: Pick<ExternalAccess.Request, "emails">): Promise<void>;
    report: {
        (options?: Video.VideoReportOptions): VideoReportRequest;
        (videoId: string, options?: Video.VideoReportOptions): VideoReportRequest;
    };
    uniqueSessionsReport(videoId: string, options?: Video.UniqueSessionReportOptions): VideoReportRequest;
    summaryStatistics: {
        (videoId: string, startDate?: undefined, endDate?: undefined, options?: Rev.RequestOptions): Promise<Video.SummaryStatistics>;
        (videoId: string, startDate: Date | string, endDate?: undefined, options?: Rev.RequestOptions): Promise<Video.SummaryStatistics>;
        (videoId: string, startDate: Date | string, endDate: Date | string, options?: Rev.RequestOptions): Promise<Video.SummaryStatistics>;
    };
    download: <T = ReadableStream<any>>(videoId: string, options?: Rev.RequestOptions) => Promise<Rev.Response<T>>;
    downloadChapter: (chapter: Video.Chapter, options?: Rev.RequestOptions) => Promise<Blob>;
    downloadSupplemental: {
        <T = Blob>(file: Video.SupplementalFile, options?: Rev.RequestOptions): Promise<T>;
        <T = Blob>(videoId: string, fileId: string, options?: Rev.RequestOptions): Promise<T>;
    };
    downloadThumbnail: {
        <T = Blob>(thumbnailUrl: string, options?: Rev.RequestOptions): Promise<T>;
        <T = Blob>(query: {
            imageId: string;
        }, options?: Rev.RequestOptions): Promise<T>;
        <T = Blob>(query: {
            videoId: string;
        }, options?: Rev.RequestOptions): Promise<T>;
    };
    downloadTranscription: {
        <T = Blob>(transcription: Transcription, options?: Rev.RequestOptions): Promise<T>;
        <T = Blob>(videoId: string, language: string, options?: Rev.RequestOptions): Promise<T>;
    };
    /**
     * This is an example of using the video Patch API to only update a single field
     * @param videoId
     * @param title
     */
    setTitle(videoId: string, title: string): Promise<void>;
    /**
     * Use the Patch API to update a single Custom Field.
     * @param videoId - id of video to update
     * @param customField - the custom field object (with id and value)
     */
    setCustomField(videoId: string, customField: Pick<Admin.CustomField, "id" | "value">): Promise<void>;
    delete(videoId: string, options?: Rev.RequestOptions): Promise<void>;
    /**
     * get processing status of a video
     * @param videoId
     */
    status(videoId: string, options?: Rev.RequestOptions): Promise<Video.StatusResponse>;
    details(videoId: string, options?: Rev.RequestOptions): Promise<Video.Details>;
    update(videoId: string, metadata: Video.UpdateRequest, options?: Rev.RequestOptions): Promise<void>;
    comments: {
        (videoId: string): Promise<Video.Comment[]>;
        (videoId: string, showAll: true): Promise<Video.Comment.Unredacted[]>;
    };
    chapters(videoId: string, options?: Rev.RequestOptions): Promise<Video.Chapter[]>;
    supplementalFiles(videoId: string, options?: Rev.RequestOptions): Promise<Video.SupplementalFile[]>;
    transcriptions(videoId: string, options?: Rev.RequestOptions): Promise<Transcription[]>;
    upload: (file: Rev.FileUploadType, metadata?: Video.UploadMetadata, options?: Rev.UploadFileOptions) => Promise<string>;
    replace: (videoId: string, file: Rev.FileUploadType, options?: Rev.UploadFileOptions) => Promise<void>;
    migrate(videoId: string, options: Video.MigrateRequest, requestOptions?: Rev.RequestOptions): Promise<void>;
    /**
     * search for videos, return as one big list. leave blank to get all videos in the account
     */
    search(query?: Video.SearchOptions, options?: Rev.SearchOptions<Video.SearchHit>): Rev.ISearchRequest<Video.SearchHit>;
    /**
     * Example of using the video search API to search for videos, then getting
     * the details of each video
     * @deprecated This method can cause timeouts if iterating through a very
     *             large number of results, as the search scroll cursor has a
     *             timeout of ~5 minutes. Consider getting all search results
     *             first, then getting details
     * @param query
     * @param options
     */
    searchDetailed(query?: Video.SearchOptions, options?: Rev.SearchOptions<VideoSearchDetailedItem>): Rev.ISearchRequest<VideoSearchDetailedItem>;
    playbackInfo(videoId: string): Promise<Video.Playback>;
    playbackUrls(videoId: string, { ip, userAgent }?: Video.PlaybackUrlsRequest, options?: Rev.RequestOptions): Promise<Video.PlaybackUrlsResponse>;
};

declare class RealtimeReportRequest<T extends Webcast.RealtimeSession = Webcast.RealtimeSession> extends SearchRequest<T> {
    summary: Webcast.RealtimeSummary;
    constructor(rev: RevClient, eventId: string, query?: Webcast.RealtimeRequest, options?: Rev.SearchOptions<T>);
    /**
     * get the aggregate statistics only, instead of actual session data.
     * @returns {Webcast.PostEventSummary}
     */
    getSummary(): Promise<Webcast.RealtimeSummary>;
}
declare class PostEventReportRequest extends SearchRequest<Webcast.PostEventSession> {
    summary: Webcast.PostEventSummary;
    constructor(rev: RevClient, query: {
        eventId: string;
        runNumber?: number;
    }, options?: Rev.SearchOptions<Webcast.PostEventSession>);
    private _assertResponseOk;
    /**
     * get the aggregate statistics only, instead of actual session data.
     * @returns {Webcast.PostEventSummary}
     */
    getSummary(): Promise<Webcast.PostEventSummary>;
}

type RealtimeSession<T extends Webcast.RealtimeRequest | undefined> = T extends {
    attendeeDetails: 'All';
} ? Webcast.RealtimeSessionDetail : T extends {
    attendeeDetails: 'Counts';
} ? never : Webcast.RealtimeSession;
declare function webcastAPIFactory(rev: RevClient): {
    list(options?: Webcast.ListRequest, requestOptions?: Rev.RequestOptions): Promise<Webcast[]>;
    search(query: Webcast.SearchRequest, options?: Rev.SearchOptions<Webcast>): Rev.ISearchRequest<Webcast>;
    create(event: Webcast.CreateRequest): Promise<string>;
    details(eventId: string, requestOptions?: Rev.RequestOptions): Promise<Webcast.Details>;
    edit(eventId: string, event: Webcast.CreateRequest): Promise<void>;
    delete(eventId: string): Promise<void>;
    editAccess(eventId: string, entities: Webcast.EditAttendeesRequest): Promise<void>;
    attendees(eventId: string, runNumber?: number, options?: Rev.SearchOptions<Webcast.PostEventSession>): PostEventReportRequest;
    realtimeAttendees<T extends Webcast.RealtimeRequest | undefined>(eventId: string, query?: T, options?: Rev.SearchOptions<RealtimeSession<T>>): RealtimeReportRequest<RealtimeSession<T>>;
    questions(eventId: string, runNumber?: number): Promise<Webcast.Question[]>;
    pollResults(eventId: string, runNumber?: number): Promise<Webcast.PollResults[]>;
    comments(eventId: string, runNumber?: number): Promise<Webcast.Comment[]>;
    status(eventId: string, requestOptions?: Rev.RequestOptions): Promise<Webcast.Status>;
    isPublic(eventId: string, requestOptions?: Rev.RequestOptions): Promise<boolean>;
    playbackUrls(eventId: string, { ip, userAgent }?: Webcast.PlaybackUrlRequest, options?: Rev.RequestOptions): Promise<Webcast.PlaybackUrlsResponse>;
    /**
     * @deprecated
     * @param eventId
     * @param options
     * @returns
     */
    playbackUrl(eventId: string, options?: Webcast.PlaybackUrlRequest): Promise<Webcast.Playback[]>;
    startEvent(eventId: string, preProduction?: boolean): Promise<void>;
    stopEvent(eventId: string, preProduction?: boolean): Promise<void>;
    startBroadcast(eventId: string): Promise<void>;
    stopBroadcast(eventId: string): Promise<void>;
    startRecord(eventId: string): Promise<void>;
    stopRecord(eventId: string): Promise<void>;
    linkVideo(eventId: string, videoId: string, autoRedirect?: boolean): Promise<any>;
    unlinkVideo(eventId: string): Promise<void>;
    /**
     * Retrieve details of a specific guest user Public webcast registration.
     * @param eventId - Id of the Public webcast
     * @param registrationId - Id of guest user's registration to retrieve
     * @returns
     */
    guestRegistration(eventId: string, registrationId: string): Promise<GuestRegistration.Details>;
    /**
     * Register one attendee/guest user for an upcoming Public webcast. Make sure you first enable Public webcast pre-registration before adding registrations.
     * @param eventId
     * @param registration
     * @returns
     */
    createGuestRegistration(eventId: string, registration: GuestRegistration.Request): Promise<GuestRegistration.Details>;
    listGuestRegistrations(eventId: string, query?: GuestRegistration.SearchRequest, options?: Rev.SearchOptions<GuestRegistration>): Rev.ISearchRequest<GuestRegistration>;
    updateGuestRegistration(eventId: string, registrationId: string, registration: GuestRegistration.Request): Promise<void>;
    patchGuestRegistration(eventId: string, registrationId: string, registration: Partial<GuestRegistration.Request>): Promise<void>;
    deleteGuestRegistration(eventId: string, registrationId: string): Promise<void>;
    listBanners(eventId: string): Promise<Banner[]>;
    addBanner(eventId: string, banner: Banner.Request): Promise<Banner>;
    setBannerStatus(eventId: string, bannerId: string, isEnabled: boolean): Promise<void>;
    updateBanner(eventId: string, banner: Banner): Promise<Banner>;
    deleteBanner(eventId: string, bannerId: string): Promise<void>;
};

declare function zonesAPIFactory(rev: RevClient): {
    list(): Promise<{
        defaultZone: Zone;
        zones: Zone[];
    }>;
    flatList(): Promise<Zone.FlatZone[]>;
    create(zone: Zone.CreateRequest): Promise<string>;
    edit(zoneId: string, zone: Zone.CreateRequest): Promise<void>;
    delete(zoneId: string): Promise<void>;
    readonly devices: () => Promise<Device.ZoneDevice[]>;
};

declare function environmentAPIFactory(rev: RevClient): {
    /**
     * Get's the accountId embedded in Rev's main entry point
     * @returns
     */
    getAccountId(forceRefresh?: boolean): Promise<string>;
    /**
     * Get's the version of Rev returned by /js/version.js
     * @returns
     */
    getRevVersion(forceRefresh?: boolean): Promise<string>;
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
    getUserLocalIp(timeoutMs?: number, forceRefresh?: boolean): Promise<string | undefined>;
};

type PayloadType = {
    [key: string]: any;
} | Record<string, any> | any[];
declare class RevClient {
    url: string;
    logEnabled: boolean;
    session: Rev.IRevSession;
    readonly admin: ReturnType<typeof adminAPIFactory>;
    readonly audit: ReturnType<typeof auditAPIFactory>;
    readonly auth: ReturnType<typeof authAPIFactory>;
    readonly category: ReturnType<typeof categoryAPIFactory>;
    readonly channel: ReturnType<typeof channelAPIFactory>;
    readonly device: ReturnType<typeof deviceAPIFactory>;
    readonly environment: ReturnType<typeof environmentAPIFactory>;
    readonly group: ReturnType<typeof groupAPIFactory>;
    readonly playlist: ReturnType<typeof playlistAPIFactory>;
    readonly recording: ReturnType<typeof recordingAPIFactory>;
    readonly upload: ReturnType<typeof uploadAPIFactory>;
    readonly user: ReturnType<typeof userAPIFactory>;
    readonly video: ReturnType<typeof videoAPIFactory>;
    readonly webcast: ReturnType<typeof webcastAPIFactory>;
    readonly zones: ReturnType<typeof zonesAPIFactory>;
    private _streamPreference;
    constructor(options: Rev.Options);
    /**
     * make a REST request
     */
    request<T = any>(method: Rev.HTTPMethod, endpoint: string, data?: any, options?: Rev.RequestOptions): Promise<Rev.Response<T>>;
    get<T = any>(endpoint: string, data?: PayloadType, options?: Rev.RequestOptions): Promise<T>;
    post<T = any>(endpoint: string, data?: PayloadType, options?: Rev.RequestOptions): Promise<T>;
    put<T = any>(endpoint: string, data?: PayloadType, options?: Rev.RequestOptions): Promise<T>;
    patch(endpoint: string, data?: PayloadType, options?: Rev.RequestOptions): Promise<void>;
    delete(endpoint: string, data?: PayloadType, options?: Rev.RequestOptions): Promise<void>;
    /**
     * authenticate with Rev
     */
    connect(): Promise<void>;
    /**
     * end rev session
     */
    disconnect(): Promise<void>;
    extendSession(): Promise<void>;
    /**
     * Returns true/false based on if the session is currently valid
     * @returns Promise<boolean>
     */
    verifySession(): Promise<boolean>;
    get isConnected(): boolean;
    get token(): string | undefined;
    get sessionExpires(): Date;
    get sessionState(): Rev.IRevSessionState;
    set sessionState(state: Rev.IRevSessionState);
    log(severity: Rev.LogSeverity, ...args: any[]): void;
}

declare class RevError extends Error {
    status: number;
    url: string;
    code: string;
    detail: string;
    constructor(response: Response, body: {
        [key: string]: any;
    } | string);
    get name(): string;
    get [Symbol.toStringTag](): string;
    static create(response: Response): Promise<RevError>;
}
declare class ScrollError extends Error {
    status: number;
    code: string;
    detail: string;
    constructor(status?: number, code?: string, detail?: string);
    get name(): string;
    get [Symbol.toStringTag](): string;
}

interface RateLimitOptions {
    /**
     * how many to allow in parallel in any given interval
     * @default 1
     */
    limit?: number;
    /**
     * interval in milliseconds
     */
    interval?: number;
    /**
     * set limit to X per second
     */
    perSecond?: number;
    /**
     * set limit to X per minute (can be fraction, i.e. 0.5 for 1 every 2 minutes)
     */
    perMinute?: number;
    /**
     * set limit to X per hour
     */
    perHour?: number;
    /**
     * cancel with AbortController
     */
    signal?: AbortSignal;
}
type ThrottledFunction<T extends (...args: any[]) => any> = ((...args: Parameters<T>) => ReturnType<T> extends PromiseLike<infer Return> ? Promise<Return> : Promise<ReturnType<T>>) & {
    /**
     * Abort pending executions. All unresolved promises are rejected with a `AbortError` error.
     * @param {string} [message] - message parameter for rejected AbortError
     * @param {boolean} [dispose] - remove abort signal listener as well
     */
    abort: (message?: string, dispose?: boolean) => void;
};
interface RateLimitOptionsWithFn<T> extends RateLimitOptions {
    /**
     * function to rate limit
     */
    fn: T;
}
declare function rateLimit<T extends (...args: any) => any>(options: RateLimitOptionsWithFn<T>): ThrottledFunction<T>;
declare function rateLimit<T extends (...args: any) => any>(fn: T, options: RateLimitOptions): ThrottledFunction<T>;
declare function rateLimit<T extends (...args: any) => any>(fn: T | RateLimitOptionsWithFn<T>, options?: RateLimitOptions): ThrottledFunction<T>;

declare function getMimeForExtension(extension?: string, defaultType?: string): string;
declare function getExtensionForMime(contentType: string, defaultExtension?: string): string;

/**
 * used in OAuth - get random verifier string
 * @param byteLength
 */
declare function randomValues(byteLength: number): string;
/**
 * sha256 hash function for oauth2 pkce
 * @param value
 * @returns
 */
declare function sha256Hash(value: string): Promise<string>;
/**
 * used to sign the verifier in OAuth workflow
 */
declare function hmacSign(message: string, secret: string): Promise<string>;
declare const polyfills: {
    AbortController: {
        new (): AbortController;
        prototype: AbortController;
    };
    AbortSignal: {
        new (): AbortSignal;
        prototype: AbortSignal;
        abort(reason?: any): AbortSignal;
        any(signals: AbortSignal[]): AbortSignal;
        timeout(milliseconds: number): AbortSignal;
    };
    createAbortError(message: string): Error;
    fetch: typeof fetch;
    FormData: {
        new (form?: HTMLFormElement, submitter?: HTMLElement | null): FormData;
        prototype: FormData;
    };
    File: {
        new (fileBits: BlobPart[], fileName: string, options?: FilePropertyBag): File;
        prototype: File;
    };
    Headers: {
        new (init?: HeadersInit): Headers;
        prototype: Headers;
    };
    Request: {
        new (input: RequestInfo | URL, init?: RequestInit): Request;
        prototype: Request;
    };
    Response: {
        new (body?: BodyInit | null, init?: ResponseInit): Response;
        prototype: Response;
        error(): Response;
        json(data: any, init?: ResponseInit): Response;
        redirect(url: string | URL, status?: number): Response;
    };
    uploadParser: {
        string(value: string | URL, options: Rev.UploadFileOptions): Promise<{
            file: Blob | File;
            options: {
                filename: string;
                contentType: string;
                contentLength?: number;
                useChunkedTransfer?: boolean;
                defaultContentType?: string;
                disableExternalResources?: boolean;
                responseType?: Rev.ResponseType;
                throwHttpErrors?: boolean;
                body?: (BodyInit | null) | undefined;
                cache?: RequestCache | undefined;
                credentials?: RequestCredentials | undefined;
                headers?: HeadersInit | undefined;
                integrity?: string | undefined;
                keepalive?: boolean | undefined;
                method?: string | undefined;
                mode?: RequestMode | undefined;
                priority?: RequestPriority | undefined;
                redirect?: RequestRedirect | undefined;
                referrer?: string | undefined;
                referrerPolicy?: ReferrerPolicy | undefined;
                signal?: (AbortSignal | null) | undefined;
                window?: null | undefined;
            };
        }>;
        stream(value: AsyncIterable<Uint8Array>, options: Rev.UploadFileOptions): Promise<{
            file: Blob | File;
            options: {
                filename: string;
                contentType: string;
                contentLength?: number;
                useChunkedTransfer?: boolean;
                defaultContentType?: string;
                disableExternalResources?: boolean;
                responseType?: Rev.ResponseType;
                throwHttpErrors?: boolean;
                body?: (BodyInit | null) | undefined;
                cache?: RequestCache | undefined;
                credentials?: RequestCredentials | undefined;
                headers?: HeadersInit | undefined;
                integrity?: string | undefined;
                keepalive?: boolean | undefined;
                method?: string | undefined;
                mode?: RequestMode | undefined;
                priority?: RequestPriority | undefined;
                redirect?: RequestRedirect | undefined;
                referrer?: string | undefined;
                referrerPolicy?: ReferrerPolicy | undefined;
                signal?: (AbortSignal | null) | undefined;
                window?: null | undefined;
            };
        }>;
        response(response: Response, options: Rev.UploadFileOptions): Promise<{
            file: Blob | File;
            options: {
                filename: string;
                contentType: string;
                contentLength?: number;
                useChunkedTransfer?: boolean;
                defaultContentType?: string;
                disableExternalResources?: boolean;
                responseType?: Rev.ResponseType;
                throwHttpErrors?: boolean;
                body?: (BodyInit | null) | undefined;
                cache?: RequestCache | undefined;
                credentials?: RequestCredentials | undefined;
                headers?: HeadersInit | undefined;
                integrity?: string | undefined;
                keepalive?: boolean | undefined;
                method?: string | undefined;
                mode?: RequestMode | undefined;
                priority?: RequestPriority | undefined;
                redirect?: RequestRedirect | undefined;
                referrer?: string | undefined;
                referrerPolicy?: ReferrerPolicy | undefined;
                signal?: (AbortSignal | null) | undefined;
                window?: null | undefined;
            };
        }>;
        blob(value: Blob | File, options: Rev.UploadFileOptions): Promise<{
            file: Blob | File;
            options: {
                filename: string;
                contentType: string;
                contentLength?: number;
                useChunkedTransfer?: boolean;
                defaultContentType?: string;
                disableExternalResources?: boolean;
                responseType?: Rev.ResponseType;
                throwHttpErrors?: boolean;
                body?: (BodyInit | null) | undefined;
                cache?: RequestCache | undefined;
                credentials?: RequestCredentials | undefined;
                headers?: HeadersInit | undefined;
                integrity?: string | undefined;
                keepalive?: boolean | undefined;
                method?: string | undefined;
                mode?: RequestMode | undefined;
                priority?: RequestPriority | undefined;
                redirect?: RequestRedirect | undefined;
                referrer?: string | undefined;
                referrerPolicy?: ReferrerPolicy | undefined;
                signal?: (AbortSignal | null) | undefined;
                window?: null | undefined;
            };
        }>;
        parse(value: Rev.FileUploadType, options: Rev.UploadFileOptions): Promise<{
            file: Blob | File;
            options: {
                filename: string;
                contentType: string;
                contentLength?: number;
                useChunkedTransfer?: boolean;
                defaultContentType?: string;
                disableExternalResources?: boolean;
                responseType?: Rev.ResponseType;
                throwHttpErrors?: boolean;
                body?: (BodyInit | null) | undefined;
                cache?: RequestCache | undefined;
                credentials?: RequestCredentials | undefined;
                headers?: HeadersInit | undefined;
                integrity?: string | undefined;
                keepalive?: boolean | undefined;
                method?: string | undefined;
                mode?: RequestMode | undefined;
                priority?: RequestPriority | undefined;
                redirect?: RequestRedirect | undefined;
                referrer?: string | undefined;
                referrerPolicy?: ReferrerPolicy | undefined;
                signal?: (AbortSignal | null) | undefined;
                window?: null | undefined;
            };
        }>;
    };
    randomValues: typeof randomValues;
    sha256Hash: typeof sha256Hash;
    hmacSign: typeof hmacSign;
    beforeFileUploadRequest(form: FormData, headers: Headers, uploadOptions: Rev.UploadFileOptions, options: Rev.RequestOptions): FormData | undefined;
    asPlatformStream<TIn = any, TOut = TIn>(stream: TIn): TOut;
    asWebStream<TIn = any>(stream: TIn): ReadableStream;
};

type RevPolyfills = typeof polyfills;
declare function setPolyfills(overrideCallback: (polyfills: RevPolyfills) => Promise<void> | void): void;

declare const utils: {
    rateLimit: typeof rateLimit;
    getExtensionForMime: typeof getExtensionForMime;
    getMimeForExtension: typeof getMimeForExtension;
    setPolyfills: typeof setPolyfills;
};

export { AccessControl, Admin, Audit, Auth, Category, Channel, Device, ExternalAccess, Group, GuestRegistration, OAuth, Playlist, Recording, RegistrationField, Rev, RevClient, RevError, Role, ScrollError, Transcription, User, Video, Webcast, Zone, RevClient as default, utils };
