import type { AccessControl, Category, Admin, Rev } from '.';

export namespace Video {
    export type ApprovalStatus = 'Approved' | 'PendingApproval' | 'Rejected' | 'RequiresApproval' | 'SubmittedApproval';

    export type VideoType = "Live" | "Vod";

    export type EncodingType = "H264" | "HLS" | "HDS" | "H264TS" | "Mpeg4" | "Mpeg2" | "WM" | "Flash" | "RTP";

    export type StatusEnum = "NotUploaded" | "Uploading" | "UploadingFinished" | "NotDownloaded" | "Downloading" | "DownloadingFinished" | "DownloadFailed" | "Canceled" | "UploadFailed" | "Processing" | "ProcessingFailed" | "ReadyButProcessingFailed" | "RecordingFailed" | "Ready";

    export type AccessControl = "AllUsers" | "Public" | "Private" | "Channels";

    export type ExpirationAction = 'Delete' | 'Inactivate';


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
        customFields?: ({ id: string, value: string; } | { name: string, value: string; })[];

        doNotTranscode?: boolean;
        is360?: boolean;

        unlisted?: boolean;

        publishDate?: string;
        userTags?: string[];
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
        customFields: Array<{ id: string, name: string, value: string, required: boolean; }>;
        /** when video was uploaded (ISO Date) */
        whenUploaded: string;
        /** the full name of user who uploaded video */
        uploadedBy: string;
        /**  */
        isActive: boolean;
        /** This is the processing status of a  */
        status: StatusEnum;
        linkedUrl: LinkedUrl | null;
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
        expirationDate: string | null;
        /**
         * This sets action when video expires. This is an enum and can have the following values: Delete/Inactivate.
         */
        expirationAction: ExpirationAction | null;
        /**
         * date video will be published
         */
        publishDate: string | null;
        lastViewed: string;
        approvalStatus: ApprovalStatus;
        thumbnailUrl: string;
        enableRatings: boolean;
        enableDownloads: boolean;
        enableComments: boolean;
        unlisted: boolean;
        is360: boolean;
        userTags: Array<{ userId: string, displayName: string; }>;
    }

    export interface PatchRequest {
        title?: string;
        categories?: string | string[];
        description?: string;
        tags?: string | string[];
        isActive?: boolean;
        expirationDate?: string | Date;
        enableRatings?: boolean;
        enableDownloads?: boolean;
        enableComments?: boolean;
        videoAccessControl?: AccessControl;
        accessControlEntities: string | string[];
        customFields: Admin.CustomField[];
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
        status?: 'active' | 'inactive';
        fromPublishedDate?: string;
        toPublishedDate?: string;
        fromUploadDate?: string;
        toUploadDate?: string;
        fromModifiedDate?: string;
        toModifiedDate?: string;

        exactMatch?: boolean;
        unlisted?: 'unlisted' | 'listed' | 'all';

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

        sortField?: 'title' | 'whenUploaded' | 'uploaderName' | 'duration' | '_score';
        sortDirection?: Rev.SortDirection;

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
        viewingStartTime: string;
        viewingEndTime: string;
    }
    export interface VideoReportOptions extends Rev.SearchOptions<VideoReportEntry> {
        videoIds?: string | string[] | undefined;
        startDate?: Date | string;
        endDate?: Date | string;
        incrementDays?: number;
        sortDirection?: Rev.SortDirection;
    }
}
