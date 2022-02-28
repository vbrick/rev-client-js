import { Rev, RegistrationField, Admin } from '.';
import { LiteralString } from './rev';

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
    shortcutName: string;
}

export namespace Webcast {
    export type WebcastAccessControl = LiteralString<'Public' | 'TrustedPublic' | 'AllUsers' | 'Private'>;
    export type SortField = LiteralString<'startDate' | 'title'>;

    export type VideoSourceType = LiteralString<
        'Capture' | 'MicrosoftTeams' | 'PresentationProfile' | 'Rtmp' | 'WebrtcSinglePresenter' | 'SipAddress' | 'WebexTeam' | 'WebexEvents' | 'WebexLiveStream' | 'Vod' | 'Zoom'
    >

    export type RealtimeField = LiteralString<
        'FullName' | 'Email' | 'ZoneName' | 'StreamType' | 'IpAddress' | 'Browser' | 'OsFamily' | 'StreamAccessed' | 'PlayerDevice' | 'OsName' | 'UserType' | 'Username' | 'AttendeeType'
    >

    export interface ListRequest {
        after?: string | Date;
        before?: string | Date;
        sortField?: SortField;
        sortDirection?: Rev.SortDirection;
    }

    export interface SearchRequest {
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
        customFields?: Array<{ id: string, value: string; } & { name: string, value: string; }>;
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
        customFields?: Array<{ id?: string, value?: string; }>;

        liveSubtitles?: {
            sourceLanguage: string
            translationLanguages: string[]
        }
        emailToPreRegistrants?: boolean;
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
        categories: Array<{ categoryId: string, name: string, fullpath: string; }>;
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
        whenAsked: string;
        question: string;
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
        username: string;
        date: string;
        comment: string;
    }

    export interface Status {
        eventTitle: string;
        startDate: string;
        endDate: string;
        eventStatus: LiteralString<'Completed' | 'Scheduled' | 'Starting' | 'InProgress' | 'Broadcasting' | 'Deleted' | 'Recording' | 'RecordingStarting' | 'RecordingStopping' | 'VideoSourceStarting'>;
        slideUrl: string;
        isPreProduction: boolean;
    }

    export interface PlaybackUrlRequest {
        ip?: string;
        userAgent?: string;
    }

    export interface Playback {
        label: string;
        qValue: number;
        player: string;
        url: string;
        zoneId: string;
        slideDelaySeconds: number;
        videoFormat: string;
        videoInstanceId: string;
        deviceId: string;
    }
}

export interface GuestRegistration {
    name: string,
    email: string,
    registrationId: string,
    registrationFieldsAnswers: Array<{ id: string, name: string, value: string }>
}

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
