import { Rev } from '.';
import { LiteralString } from './rev';

export interface Webcast {
    id: string;
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    listingType: Webcast.WebcastAccessControl;
    eventUrl: string;
    backgroundImages: Array<{ backgroundImageUrl: string, scaleSize: string; }>;
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
        title?: string;
        description?: string;
        startDate: string | Date;
        endDate: string | Date;

        presentationProfileId?: string;
        vcSipAddress?: string;

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
        accessControl?: WebcastAccessControl;
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
        linkedVideoId?: string;
        autoAssociateVod?: boolean;
        redirectVod?: boolean;
        registrationFieldIds?: string[];
        customFields?: Array<{ id?: string, value?: string; }>;
    }


    export interface Details {
        eventId: string;
        title: string;
        description: string;
        startDate: string;
        endDate: string;

        presentationProfileId?: string;
        vcSipAddress?: string;

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
        presentationFileDownloadAllowed: boolean;
        registrationFields: Array<{
            id: string;
            name: string;
            fieldType: string;
            required: boolean;
            options: string[];
            includeInAllWebcasts: boolean;
        }>;
        customFields?: Array<{
            id: string;
            name: string;
            value: string;
            required: boolean;
            displayedToUsers: boolean;
            fieldType: string;
        }>;
    }

    export interface EditAttendeesRequest {
        userIds?: string[];
        usernames?: string[];
        groupIds?: string[];
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
        multicastErrors: number;
        bufferEvents: number;
        rebufferEvents: number;
        rebufferDuration: number;
        attendeeType: LiteralString<'Host' | 'Moderator' | 'AccountAdmin' | 'Attendee'>;
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
