import type { AccessControl, Category, Admin, Rev } from './index';
import type { LiteralString } from './rev';

/** @category Videos */
export namespace Video {
    export type AccessControl = LiteralString<"AllUsers" | "Public" | "Private" | "Channels">;
    export type ApprovalStatus = LiteralString<'Approved' | 'PendingApproval' | 'Rejected' | 'RequiresApproval' | 'SubmittedApproval'>;
    export type EncodingType = LiteralString<"H264" | "HLS" | "HDS" | "H264TS" | "Mpeg4" | "Mpeg2" | "WM" | "Flash" | "RTP">;
    export type ExpirationAction = LiteralString<'Delete' | 'Inactivate'>;
    export type ExpiryRule = LiteralString<'None' | 'DaysAfterUpload' | 'DaysWithoutViews'>;

    export type SourceType = LiteralString<'REV' | 'WEBEX' | 'API' | 'VIDEO CONFERENCE' | 'WebexLiveStream' | 'LiveEnrichment'>
    export type VideoType = LiteralString<"Live" | "Vod">;

    export type SortFieldEnum = LiteralString<"title" | "_score" | "recommended" | "whenUploaded" | "whenPublished" | "whenModified" | "lastViewed" | "ownerName" | "uploaderName" | "duration" | "viewCount" | "averageRating" | "commentCount">

    export type StatusEnum = LiteralString<"NotUploaded" | "Uploading" | "UploadingFinished" | "NotDownloaded" | "Downloading" | "DownloadingFinished" | "DownloadFailed" | "Canceled" | "UploadFailed" | "Processing" | "ProcessingFailed" | "ReadyButProcessingFailed" | "RecordingFailed" | "Ready">;

    export type SearchFilterEnum = LiteralString<"myRecommendations" | "mySubscriptions">;

    export type MetadataGenerationField = LiteralString<"description" | "title" | "tags" | "all" | "chapters">;

    export type MetadataGenerationStatus = LiteralString<"NotStarted" | "InProgress" | "Success" | "Failed">;

    export type RemovedVideoState = LiteralString<"Deleted" | "ChangedToPrivate" | "ChangedToInactive" | "ChangedToUnlisted">;

    export type AudioTrackStatus = LiteralString<"Ready" | "Pending" | "Processing" | "Adding" | "Updating" | "Deleting" | "AddingFailed">

    export interface LinkedUrl {
        Url: string;
        EncodingType: EncodingType;
        Type: VideoType;
        IsMulticast: boolean;
    }

    export interface SearchHit {
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
        speechResult: Array<{ time: string, text: string; }>;
        unlisted: boolean;
        whenModified: string;
        whenPublished: string;
        commentCount: number;
        hasTranscripts: boolean;
        hasHls: boolean;
        hasAudioOnly: boolean;
        hasDualStreams: boolean;
        isConvertedToSwitched: boolean;
        sourceType: SourceType;
        thumbnailSheets: string;
        score: number;
        canEdit: boolean;
    }
    export interface UploadMetadata {
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
        accessControlEntities?: Array<(Omit<AccessControl.Entity, 'id' | 'canEdit'> | Omit<AccessControl.Entity, 'name' | 'canEdit'>) & {canEdit?: boolean}>;

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
         * This will prevent sensitive content from being indexed in Elastic Search.
         * NOTE: Feature must be enabled (contact Vbrick Support)
         */
        sensitiveContent?: boolean;

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
            transcribeLanguageId: Transcription.SupportedLanguage;
            /**
             * Creates AI-generated metadata for a given video based on the type specified. You must specify the field type you want to generate (description/title/tags/chapters).
             * This feature requires English transcription and must also be enabled for your Rev account.
             */
            metadataGenerationFields?: Array<LiteralString<'title' | 'description' | 'tags' | 'chapters'>>
        }
    }
    export type UpdateRequest = Omit<Video.UploadMetadata, 'uploader' | 'categoryIds' | 'doNotTranscode' | 'is360' | 'sourceType' | 'legacyViewCount' | 'postUploadActions'> & {
        /**
         * List of category IDs. If you use categoryIds and they do not exist/are incorrect, the request is rejected. The request is also rejected if you do not have contribute rights to a restricted category and you attempt to add/edit or otherwise modify it.
         */
        categories?: string;
        audioTracks?: Array<AudioTrack.Request>;
        expirationDate?: string;
        expirationAction?: Video.ExpirationAction;
        linkedUrl?: Video.LinkedUrl
    }

    export interface MigrateRequest {
        /** change "uploader" value to this user */
        userName?: string;
        /** change "owner" to this user. Owner takes precedence over Uploader field in sorting/UI */
        owner?: {
            userId: string;
        },
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
        /**
         * This will prevent sensitive content from being indexed in Elastic Search.
         * @deprecated - consider using the PATCH API instead
         */
        sensitiveContent?: boolean;
    }



    export interface Details {
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
        categoryPaths: Array<{ categoryId: string, name: string, fullPath: string; }>;
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
        }
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
        }
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
        userTags: Array<{ userId: string, displayName: string; }>;

        duration: string;
        audioTracks: Array<AudioTrack>;
        overallProgress: number;
        isProcessing: boolean;
        transcodeFailed: boolean;
        instances: Array<{
            id: string;
            isOriginalInstance: boolean;
            name: string | null;
            preset: {
                container?: string;
            }
            size: number;
            status: LiteralString<'Initialized' | 'Transcoding' | 'Transcoded' | 'TranscodingFailed' | 'Storing' | 'Stored' | 'StoringFailed'>
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
            }>
        }
        hasAudioOnly: boolean;
        viewerIdEnabled: boolean;
        enableAutoShowChapterImages: boolean;
        sensitiveContent: boolean;
    }

    export interface PatchRequest {
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
        sensitiveContent?: boolean;
    }

    export interface StatusResponse {
        videoId: string;
        title: string;
        status: StatusEnum;
        isProcessing: boolean;
        overallProgress: number;
        isActive: boolean;
        uploadedBy: string;
        whenUploaded: string;
    }

    export interface SearchOptions {
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
        /** Use the first and last name of the uploader or an exact match of the uploader's username. Note that partial matches may still be returned. For example, uploaders=\"john doe\" will retrieve all videos uploaded by a user with the first and last name \"john doe\". To return an exact match, you must use the uploaderIds query string */
        uploaders?: string;
        /** list of uploader IDs separated by commas */
        uploaderIds?: string;
        /** Retrieve videos owned by users by searching with the username as the search criterion. Example: owners=johndoe,janedoe */
        owners?: string;
        /** Owner GUIDs to get specific videos owner by these users. Example: ownerIds=abc, xyz */
        ownerIds?: string;
        status?: LiteralString<'active' | 'inactive'>;
        fromPublishedDate?: string | Date;
        toPublishedDate?: string | Date;
        fromUploadDate?: string | Date;
        toUploadDate?: string | Date;
        fromModifiedDate?: string | Date;
        toModifiedDate?: string | Date;

        exactMatch?: boolean;
        unlisted?: LiteralString<'unlisted' | 'listed' | 'all'>;

        /**
         * If provided, videos will be filtered by access control
         */
        accessControl?: AccessControl;

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

    export interface Playback {
        id: string;
        title: string;
        categories: Category[];
        description: string;
        htmlDescription: string;
        tags: string[];
        // url for preview image (may require authentication)
        thumbnailUrl: string;
        // video url for embedding in iframe
        playbackUrl: string;
    }

    export interface PlaybackUrlsRequest {
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

    export interface PlaybackUrlsResponse {
        playbackResults: PlaybackUrlResult[];
        jwtToken: string;
    }

    export interface PlaybackUrlResult {
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

    export interface VideoReportEntry {
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
    export interface VideoReportOptions extends Rev.SearchOptions<VideoReportEntry> {
        videoIds?: string | string[] | undefined;
        startDate?: string | Date;
        endDate?: string | Date;
        incrementDays?: number;
        sortDirection?: Rev.SortDirection;
    }

    export interface UniqueSessionReportOptions extends Rev.SearchOptions<VideoReportEntry> {
        userId?: string;
        startDate?: string | Date;
        endDate?: string | Date;
        incrementDays?: number;
        sortDirection?: Rev.SortDirection;
    }

    export interface SummaryStatistics {
        totalViews: number;
        totalSessions: number;
        totalTime: string;
        averageTime: string;
        completionRate: number;
        totalUniqueViews: number;
        deviceCounts: Array<{ key: string, value: number }>
        totalViewsByDay: Array<{ key: string, value: number }>
        browserCounts: Array<{ key: string, value: number }>
    }

    export interface AudioTrack {
        track: number;
        isDefault: boolean;
        languageId: AudioTrack.Language;
        languageName: string;
        status: AudioTrackStatus;
    }
    export namespace AudioTrack {
        export type Language = Transcription.SupportedLanguage | 'und'
        export interface Request {
            track: number;
            languageId: AudioTrack.Language;
            isDefault?: boolean;
            status?: AudioTrackStatus;
        }
        export interface PatchRequest {
            op: Rev.PatchOperation['op'];
            languageId?: AudioTrack.Language;
            track?: number;
            value?: Pick<AudioTrack.Request, 'languageId' | 'isDefault'>;
        }
    }

    export interface Comment {
        id: string;
        text: string;
        date: string;
        username: string;
        firstName: string;
        lastName: string;
        isRemoved: boolean;
        childComments: Comment[];
    }
    export namespace Comment {

        export interface Request {
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

        export interface ListResponse {
            id: string;
            title: string;
            comments: Comment[];
        }

        export interface Unredacted extends Comment {
            isRemoved: boolean;
            deletedBy: string | null;
            deletedWhen: string;
        }
    }

    export interface Chapter {
        title: string;
        startTime: string;
        imageUrl: string;
    }

    export namespace Chapter {
        export interface Request {
            /**
             * time in 00:00:00 format
             */
            time: string;
            title?: string;
            imageFile?: Rev.FileUploadType;
            /** set filename/contenttype or other options for appended file */
            uploadOptions?: Rev.UploadFileOptions & {
                contentType?: LiteralString<'image/gif' | 'image/jpeg' | 'image/png'>
            };
        }
    }

    export interface SupplementalFile {
        downloadUrl: string;
        fileId: string;
        filename?: string;
        size: number;
        title: string;
    }

    /** @deprecated - use higher level Transcription namespace */
    export interface Transcription {
        downloadUrl: string,
        fileSize: number;
        filename: string;
        locale: string;
    }

    export namespace Search {
        export interface SuggestionOptions {
            q?: string;

        }

    }

    export interface PausedVideoResponse {
        videos: PausedVideoItem[];
        totalVideos: number;
    }
    export interface PausedVideoItem extends Video.SearchHit {
        sessionId: string;
        timeStamp: string;
    }

    export interface WaitTranscodeOptions {
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

    export interface ClipRequest {
        /**
         * Start time of the video clip in timespan format (e.g. <code>00:00:00.000</code>) with hours, minutes, seconds, and optional milliseconds. Minutes and seconds should be from 0-59, and milliseconds have three digits.
         */
        start: string,
        /**
         * End time of the video clip in timespan format (e.g. <code>00:00:00.000</code>) with hours, minutes, seconds, and optional milliseconds. Minutes and seconds should be from 0-59, and milliseconds have three digits.
         */
        end: string,
        /**
         * ID of the video within the system. The video must be accessible and editable to the account used for API authorization. If the video ID matches the video ID in the API call then leave blank or null, otherwise the video ID is required.
         */
        videoId?: string
    }

    export interface ThumbnailConfiguration {
        /** Total number of horizontal tiles making up the thumbsheet. */
        horizontalTiles: number
        /** Total number of vertical tiles making up the thumbsheet. */
        verticalTiles: number
        /** Seconds per frame. */
        spf: number
        /** Total number of thumbnails contained in the sheet. */
        totalThumbnails: number
        /** Thumbnail sheet width in pixels. */
        sheetWidth: number
        /** Thumbnail sheet height in pixels. */
        sheetHeight: number
        /** Uri to thumbnail sheet instance. */
        thumbnailSheetsUri: string
        /** Number of thumbnail sheets. */
        numSheets: number
    }

    export interface RemovedVideosQuery {
        fromDate?: string;
        toDate?: string;
        state?: RemovedVideoState
    }

    export interface RemovedVideoItem {
        /** Video ID */
        id: string;
        state: RemovedVideoState;
        accountId: string;
        /** ISO Date */
        when: string;
    }
}

/** @category Videos */
export interface Transcription {
    downloadUrl: string,
    fileSize: number;
    filename: string;
    locale: string;
}
/** @category Videos */
export namespace Transcription {
    export type SupportedLanguage = LiteralString<"da" | "de" | "el" | "en" | "en-gb" | "es" | "es-419" | "es-es" | "fi" | "fr" | "fr-ca" | "id" | "it" | "ja" | "ko" | "nl" | "no" | "pl" | "pt" | "pt-br" | "ru" | "sv" | "th" | "tr" | "zh" | "zh-tw" | "zh-cmn-hans" | "cs" | "en-au" | "hi" | "lt" | "so" | "hmn" | "my" | "cnh" | "kar" | "ku-kmr" | "ne" | "sw" | "af" | "sq" | "am" | "az" | "bn" | "bs" | "bg" | "hr" | "et" | "ka" | "ht" | "ha" | "hu" | "lv" | "ms" | "ro" | "sr" | "sk" | "sl" | "tl" | "ta" | "uk" | "vi">
    export type TranslateSource = Extract<SupportedLanguage, 'en' | 'en-gb' | 'fr' | 'de' | 'pt-br' | 'es' | 'zh-cmn-hans' | 'hi' | 'nl' | 'it'>;
    export type ServiceType = LiteralString<'Vbrick' | 'Manual'>
    export type StatusEnum = LiteralString<'NotStarted' | 'Preparing' | 'InProgress' | 'Success' | 'Failed'>;
    export interface Request {
        language: Transcription.SupportedLanguage;
        audioTrack?: number;
        /** @deprecated - voicebase removed so no longer needed */
        serviceType?: Extract<Transcription.ServiceType, 'Vbrick'>
    }
    export interface Status {
        videoId: string;
        transcriptionId: string;
        status: Transcription.StatusEnum;
        language: Transcription.SupportedLanguage;
        transcriptionService: Transcription.ServiceType;
    }
    export interface TranslateResult {
        videoId: string;
        title: string;
        sourceLanguage: Transcription.TranslateSource;
        translations: Array<{
            language: Transcription.SupportedLanguage;
            transcriptionId: string;
            status: Transcription.StatusEnum;
        }>;
    }
}

/** @category Videos */
export interface ExternalAccess {
    /**
     * email address this token is associated with
     */
  email: string

  /**
   * When this token was added (JSON date)
   */
  whenAdded: string

  /**
   * Current status of the token.
   */
  status: LiteralString<'Active' | 'Revoked' | 'Expired'>

  /**
   * which Rev User generated this token
   */
  grantor: string

  /**
   * the date until this token expires
   */
  validUntil: string

  /**
   * link to access the resource this token is associated with
   */
  link: string
  /**
   * optional message assigned when the token was created
   */
  message: string
}
/** @category Videos */
export namespace ExternalAccess {
    export interface Request {
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
    export interface RenewResponse {
        /**
         * Email that external access could not be renewed for.
         */
        invalidEmails: string[]
      }
}
