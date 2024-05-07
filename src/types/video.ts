import type { AccessControl, Category, Admin, Rev } from '.';
import { LiteralString } from './rev';

export namespace Video {
    export type AccessControl = LiteralString<"AllUsers" | "Public" | "Private" | "Channels">;
    export type ApprovalStatus = LiteralString<'Approved' | 'PendingApproval' | 'Rejected' | 'RequiresApproval' | 'SubmittedApproval'>;
    export type EncodingType = LiteralString<"H264" | "HLS" | "HDS" | "H264TS" | "Mpeg4" | "Mpeg2" | "WM" | "Flash" | "RTP">;
    export type ExpirationAction = LiteralString<'Delete' | 'Inactivate'>;
    export type ExpiryRule = LiteralString<'None' | 'DaysAfterUpload' | 'DaysWithoutViews'>;

    export type SourceType = LiteralString<'REV' | 'WEBEX' | 'API' | 'VIDEO CONFERENCE' | 'WebexLiveStream' | 'LiveEnrichment'>
    export type VideoType = LiteralString<"Live" | "Vod">;

    export type SortFieldEnum = LiteralString<"duration" | "lastViewed" | "ownerName" | "title" | "uploaderName" | "viewCount" | "whenUploaded" | "_score">

    export type StatusEnum = LiteralString<"NotUploaded" | "Uploading" | "UploadingFinished" | "NotDownloaded" | "Downloading" | "DownloadingFinished" | "DownloadFailed" | "Canceled" | "UploadFailed" | "Processing" | "ProcessingFailed" | "ReadyButProcessingFailed" | "RecordingFailed" | "Ready">;

    export type SearchFilterEnum = LiteralString<"myRecommendations" | "mySubscriptions">;
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
        };
        averageRating: number;
        ratingsCount: number;
        speechResult: Array<{ time: string, text: string; }>;
        unlisted: boolean;
        whenModified: string;
        whenPublished: string;
        commentCount: number;
        score: number;
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

        enableRatings?: boolean;
        enableDownloads?: boolean;
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
         * Retain the total views count from an outside system as an optional param.

         */
        legacyViewCount?: number;
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
        /** list of uploader names separated by commas */
        uploaders?: string;
        /** list of uploader IDs separated by commas */
        uploaderIds?: string;
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
        searchField?: string;

        includeTranscriptSnippets?: boolean;

        /**
         * Show recommended videos for the specified Username. Videos returned are based on the user’s
         * last 10 viewed videos. Must be Account Admin or Media Admin to use this query. Sort order
         * must be _score. User must exist.
         */
        recommendedFor?: string;

        sortField?: SortFieldEnum;
        sortDirection?: Rev.SortDirection;

        /**
         * If channelId provided, videos in that particular channel are returned. User should have rights to the channel
         */
        channelId?: string;

        /**
         * Filter the results based on the channels and categories the Principal is subscribed OR apply the recommendation logic which boosts search results based on recent viewing history using up to the last 10 videos viewed by a user.
         */
        filter?: SearchFilterEnum;

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
        startDate?: string;
        endDate?: string;
        incrementDays?: number;
        sortDirection?: Rev.SortDirection;
    }

    export interface UniqueSessionReportOptions extends Rev.SearchOptions<VideoReportEntry> {
        userId?: string;
        startDate?: string;
        endDate?: string;
        incrementDays?: number;
        sortDirection?: Rev.SortDirection;
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
            uploadOptions?: Rev.UploadFileOptions;
        }
    }

    export interface SupplementalFile {
        downloadUrl: string;
        fileId: string;
        filename?: string;
        size: number;
        title: string;
    }

    export interface Transcription {
        downloadUrl: string,
        fileSize: number;
        filename: string;
        locale: string;
    }

    export namespace Transcription {
        export type SupportedLanguages = LiteralString<"da" | "de" | "el" | "en" | "en-gb" | "es" | "es-419" | "es-es" | "fi" | "fr" | "fr-ca" | "id" | "it" | "ja" | "ko" | "nl" | "no" | "pl" | "pt" | "pt-br" | "ru" | "sv" | "th" | "tr" | "zh" | "zh-tw" | "zh-cmn-hans" | "cs" | "en-au" | "hi" | "lt" | "so" | "hmn" | "my" | "cnh" | "kar" | "ku-kmr" | "ne" | "sw" | "af" | "sq" | "am" | "az" | "bn" | "bs" | "bg" | "hr" | "et" | "ka" | "ht" | "ha" | "hu" | "lv" | "ms" | "ro" | "sr" | "sk" | "sl" | "tl" | "ta" | "uk" | "vi">
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
}

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
