import type { Rev, RegistrationField, Admin, Upload } from './index';
import type { Video } from './video';
import type { LiteralString } from './rev';

/** @category Webcasts */
export interface Webcast {
    id: string;
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    listingType: Webcast.WebcastAccessControl;
    eventUrl: string;
    backgroundImages: Array<{ url: string, scaleSize: string; }>;
    categories: Array<{ categoryId: string, name: string, fullpath: string; }>;
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
    shortcutName?: string | null;
    shortcutNameUrl?: string | null;
    linkedVideoId?: string | null;
    isFeatured: boolean;
    /**
     * Attendee join method. Only required when 'accesscontrol' is Public. Default is 'Registration'. When set to 'Anonymous', no attendee specific details are collected or registered.
     */
    attendeeJoinMethod?: LiteralString<'Anonymous' | 'Registration'> | null;
}

/** @category Webcasts */
export namespace Webcast {
    export type WebcastAccessControl = LiteralString<'Public' | 'TrustedPublic' | 'AllUsers' | 'Private'>;
    export type SortField = LiteralString<'startDate' | 'title'>;

    export type VideoSourceType = LiteralString<
        'Capture' | 'MicrosoftTeams' | 'PresentationProfile' | 'Rtmp' | 'WebrtcSinglePresenter' | 'SipAddress' | 'WebexTeam' | 'WebexEvents' | 'WebexLiveStream' | 'Vod' | 'Zoom' | 'Pexip' | 'Producer'
    >

    export type RealtimeField = LiteralString<
        'FullName' | 'Email' | 'ZoneName' | 'StreamType' | 'IpAddress' | 'Browser' | 'OsFamily' | 'StreamAccessed' | 'PlayerDevice' | 'OsName' | 'UserType' | 'Username' | 'AttendeeType'
    >

    export type QuestionOption = LiteralString<'IDENTIFIED' | 'SELFSELECT' | 'ANONYMOUS'>

    export type AttendeeJoinMethod = LiteralString<'Anonymous' | 'Registration'>

    export interface ListRequest {
        after?: string | Date;
        before?: string | Date;
        sortField?: SortField;
        sortDirection?: Rev.SortDirection;
    }

    export interface SearchRequest {
        /**
         * Search parameter to use to match those events that are set to start on or after the date specified. Value should be less than or equal to endDate. If not specified, it assumes a value of endDate - 365 days.
         */
        startDate?: string | Date;
        /**
         * Search parameter to use to match those events that are set to start on or before the date specified. Value should be greater than or equal to startDate. If not specified, it assumes a value of the current date.
         */
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
        /**
         * An optional search term boolean value (true or false) indicating whether to include or exclude events tagged as featured.
         */
        isFeatured?: boolean;
        preRollVideoId: string | null;
        postRollVideoId: string | null;
    }

    export interface CreateRequest {
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
        }
        zoom?: {
            meetingId: string;
            meetingPassword?: string;
        }
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
        questionOption?: Webcast.QuestionOption;
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
            sourceLanguage: string
            translationLanguages: string[]
        }
        emailToPreRegistrants?: boolean;

        /**
         * Attendee join method. Only required when 'accesscontrol' is Public. Default is 'Registration'. When set to 'Anonymous', no attendee specific details are collected or registered.
         */
        attendeeJoinMethod?: Webcast.AttendeeJoinMethod;
        /**
         * Internal user Ids. Only required when 'Producer' selected as a videoSourceType.
         */
        presenterIds?: string[];
        /**
         * Only required when 'Producer' selected as a videoSourceType.
         */
        externalPresenters?: Array<{ name: string, title: string, email: string }>;

        embeddedContent?: {
            isEnabled: boolean;
            contentLinks: Array<Webcast.ContentLink.Request | Webcast.ContentLink>
        }

        bannerDetails?: {
            isEnabled: boolean;
            /**
             * Maximum allowed banners are five
             */
            banners: Array<WebcastBanner.Request>
        }
        viewerIdEnabled?: boolean;

        reactionsSettings?: ReactionsSettings;
        /**
         * Default=false. If enabled by admins on the branding page, featured events will show on the home page carousel to viewers with permission. Featured events will not show in the featured carousel once the event has ended.
         */
        isFeatured?: boolean;

        /**
         * Default=false. If accessControl is set to Public and 'EDIT PUBLIC REG. PAGE CONSENT VERBIAGE' is enabled on the account. When true, you can customize the consent verbiage for public attendees.
         */
        isCustomConsentEnabled?: boolean;
        /**
         * If isCustomConsentEnabled is true then you can customize the consent verbiage for public attendees.
         */
        consentVerbiage?: string;
        /**
         * Video Id of the Bumper video for the event.
         * After the event is complete and there is a Recording, this video will be added to the Beginning of your Recording.
         */
        preRollVideoId?: string;
        /**
         * After the event is complete and there is a Recording, this video will be added to the Ending of your Recording.
         */
        postRollVideoId?: string;
    }

    export interface Details {
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
        }
        zoom?: {
            meetingId: string;
            meetingPassword?: string;
        }
        vodId?: string;
        rtmp?: {
            url: string;
            key: string;
        }
        liveSubtitles?: {
            sourceLanguage: string
            translationLanguages: string[]
        }

        eventAdminIds: string[];
        primaryHostId: string | null;
        automatedWebcast: boolean;
        closedCaptionsEnabled: boolean;
        pollsEnabled: boolean;
        chatEnabled: boolean;
        questionOption: Webcast.QuestionOption;
        questionAndAnswerEnabled: boolean;
        userIds: string[];
        groupIds: string[];
        moderatorIds: string[];
        password: string | null;
        accessControl: WebcastAccessControl;
        categories: Array<{ categoryId: string, name: string, fullpath: string; }>;
        tags?: string[];
        unlisted: boolean;
        estimatedAttendees: number;
        lobbyTimeMinutes: number;
        webcastPreProduction?: {
            duration: string;
            userIds: string[];
            groupIds: string[];
        };
        shortcutName: string | null;
        shortcutNameUrl: string | null;
        linkedVideoId: string | null;
        autoAssociateVod: boolean;
        redirectVod: boolean;
        recordingUploaderUserId: string;
        disableAutoRecording?: boolean;
        hideShareUrl?: boolean;
        enableCustomBranding: boolean;
        /**
         * Internal user Id. Only used when 'WebrtcSinglePresenter' selected as a videoSourceType.
         */
        presenterId?: string | null;
        /**
         * Internal user Ids. Only used when 'Producer' selected as a videoSourceType.
         */
        presenterIds?: string[];

        brandingSettings: Webcast.BrandingSettings | null;

        autoplay?: boolean;

        presentationFileDownloadAllowed: boolean;
        registrationFields: RegistrationField[];
        customFields?: Admin.CustomField[];
        emailToPreRegistrants?: boolean;
        attendeeJoinMethod?: Webcast.AttendeeJoinMethod;
        embeddedContent: {
            isEnabled: boolean;
            contentLinks: Webcast.ContentLink[];
        }
        bannerDetails?: {
            isEnabled: boolean;
            banners: WebcastBanner[];
        }
        viewerIdEnabled: boolean;
        externalPresenters: Array<{
            name: string;
            title: string;
            email: string;
        }>;
        producerBgImages?: Array<{
            imageId: string;
            imageUrls: Array<{ url: string; scaleSize: string; }>
        }>;
        reactionsSettings: ReactionsSettings;
        /**
         * Default=false. If enabled by admins on the branding page, featured events will show on the home page carousel to viewers with permission. Featured events will not show in the featured carousel once the event has ended.
         */
        isFeatured: boolean;
        preRollVideoId: string | null;
        postRollVideoId: string | null;
        // as of 7.64 not yet standardized/documented
        // isCustomConsentEnabled?: boolean;
        // consentVerbiage?: string;

    }

    export interface EditAttendeesRequest {
        userIds?: string[];
        usernames?: string[];
        groupIds?: string[];
    }

    export interface PostEventSummary {
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

    export interface PostEventSession {
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
        enteredDate: string; // date-time
        exitedDate: string; // date-time
        viewingStartTime: string; // date-time
        experiencedErrors: number;
        multicastErrorsPerAttendees: number;
        bufferEvents: number;
        rebufferEvents: number;
        rebufferDuration: number;
        attendeeType: LiteralString<'Host' | 'Moderator' | 'AccountAdmin' | 'Attendee'>;
    }

    export interface RealtimeRequest {
        sortField?: RealtimeField;
        sortDirection?: Rev.SortDirection;
        count?: number;
        q?: string;
        searchField?: RealtimeField;
        runNumber?: number;
        status?: LiteralString<'All' | 'Online' | 'Offline'>;
        attendeeDetails?: LiteralString<'Base' | 'All' | 'Counts'>;
    }

    export interface RealtimeSummary {
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

    export interface RealtimeSession {
        userId: string;
        username: string;
        fullName: string;
        email: string;
        startTime: string; // date-time
        sessionId: string;
    }

    export interface RealtimeSessionDetail extends RealtimeSession {
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

    export interface Question {
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

    export interface PollResults {
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

    export interface Comment {
        commentId: string;
        userId: string;
        username: string;
        date: string;
        comment: string;
        htmlComment: string;
        hidden: boolean;
    }

    export interface Status {
        eventTitle: string;
        startDate: string;
        endDate: string;
        status: LiteralString<'Completed' | 'Scheduled' | 'Starting' | 'InProgress' | 'Broadcasting' | 'Deleted' | 'Recording' | 'RecordingStarting' | 'RecordingStopping' | 'VideoSourceStarting'>;
        slideUrl: string;
        isPreProduction: boolean;
        sbmlResponse?: string;
        reason?: string;
    }

    export interface PlaybackUrlRequest {
        ip?: string;
        userAgent?: string;
    }

    export interface PlaybackUrlsResponse extends Video.PlaybackUrlsResponse {}

    export interface Playback extends Video.PlaybackUrlResult {

    }
    export interface ReactionsSummary {
        /**
         * Date and time the reaction was recorded.
         */
        webcastDate: string;
        /**
         * The emoji character.
         */
        reaction: string;
        /**
         * The unicode representation of the emoji character.
         */
        unicode: string;
        /**
         * The number of emojis sent.
         */
        count: number;
    }

    export interface BrandingSettings {
        headerColor: string;
        headerFontColor: string;
        primaryFontColor: string;
        accentColor: string;
        accentFontColor: string;
        primaryColor: string;
        logos: Array<{ url: string, scaleSize: LiteralString<'Original' | 'ExtraSmall' | 'Small' | 'Medium' | 'Large'> }>
    }

    export interface BrandingRequest {
        branding: Omit<Webcast.BrandingSettings, 'logos'>
        logoImage: Rev.FileUploadType,
        logoImageOptions?: Exclude<Upload.ImageOptions, Rev.RequestOptions>
        backgroundImage: Rev.FileUploadType,
        backgroundImageOptions?: Exclude<Upload.ImageOptions, Rev.RequestOptions>

    }

    export interface ContentLink {
        id: string;
        isEnabled: boolean;
        /**
         * The name that appears to attendees and that appears on the flyout tab during the webcast.
         */
        name: string;
        /**
         * The third-party URL or embed code. Look for this on the application or website that you will be embedding. This can usually be found in its Admin or Settings section.
         */
        code: string;
        /**
         * Icon that is assigned to the flyout tab and is clicked to open.
         */
        icon: LiteralString<'abc-text' | 'barchart' | 'group-2' | 'group-3' | 'person-check' | 'person-record' | 'person-wave' | 'poll-chart' | 'end' | 'smile-face' | 'vote-box'>
    }
    export namespace ContentLink {
        /** @interface */
        export type Request = Omit<ContentLink, 'id' | 'isEnabled'>
    }

    export interface ReactionsSettings {
        /**
         * Default=false. When true, the Live Emoji Reactions feature is enabled for the event.
         */
        enabled?: boolean;
        /**
         * List of emojis available for the event. If omitted or left empty the emojis will default to the standard set.
         */
        emojis?: Array<{
            /** The unicode representation of the emoji character. */
            character: string,
            /** The name of the emoji. */
            name: string
        }>
    }

    export namespace BulkDelete {
        export interface Response {
            jobId: string;
            count: number;
            statusUrl: string;
        }
        export interface Status {
            jobId: string;
            count: number;
            status: LiteralString<'Initialized' | 'InProgress' | 'Completed'>;
            processedCount: number;
            failedCount: number;
            remainingCount: number;
        }
    }


}
/** @category Webcasts */
export interface GuestRegistration {
    name: string,
    email: string,
    registrationId: string,
    registrationFieldsAnswers: Array<{ id: string, name: string, value: string }>
}
/** @category Webcasts */
export namespace GuestRegistration {
    export interface Details extends GuestRegistration {
        token: string
    }

    export interface Request {
        name: string,
        email: string,
        registrationFieldsAnswers?: Array<{ id?: string, name?: string, value: string }>
    }

    export interface SearchRequest {
        sortField?: LiteralString<'name' | 'email'>,
        sortDirection?: Rev.SortDirection,
        size?: number
    }
}

/** @category Webcasts */
export interface WebcastBanner {
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
/** @category Webcasts */
export namespace WebcastBanner {
    export type Request = Omit<WebcastBanner, 'id'>;
}
