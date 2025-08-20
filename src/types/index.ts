import type { LiteralString } from './rev';

export type { AccessControl } from './access-control';
export type { Admin } from './admin';
export type { Audit } from './audit';
export type { Auth, OAuth } from './auth';
export type { Category } from './category';
export type { Channel } from './channel';
export type { Device } from './device';
export type { Group } from './group';
export type { Rev } from './rev';
export type { Upload } from './upload';
export type { User } from './user';
export type { Video, ExternalAccess, Transcription } from './video';
export type { Playlist } from './playlist';
export type { Recording } from './recording';
export type { Webcast, GuestRegistration, WebcastBanner } from './webcast';
export type { Zone } from './zone';

/**
 * @category Users & Groups
 */
export interface Role {
    id: string;
    name: Role.RoleType;
}

/**
 * @category Users & Groups
 */
export namespace Role {
    export type RoleType = LiteralString<'AccountAdmin' | 'MediaAdmin' | 'EventAdmin' | 'EventHost' | 'InternalEventHost' | 'MediaContributor' | 'InternalMediaContributor' | 'MediaViewer' | 'TeamCreator' | 'CategoryCreator' | 'VodAnalyst' | 'EventAnalyst' | 'RevIqUser' | 'ChannelCreator' | 'MediaUploader' | 'InternalMediaUploader'>;
    export type RoleName = LiteralString<'Account Admin' | 'Media Admin' | 'Media Contributor' | 'Media Viewer' | 'Event Admin' | 'Event Host' | 'Channel Creator' | 'Category Creator' | 'Internal Event Host' | 'Internal Media Contributor' | 'VOD Analyst' | 'Event Analyst' | 'Rev IQ User' | 'Media Uploader' | 'Internal Media Uploader'>;
    export type Details = {
        id: string;
        name: string;
        description: string;
        roleType: Role.RoleType;
    };
}

/** @category Webcasts */
export interface RegistrationField {
    id: string;
    name: string;
    fieldType: LiteralString<'Text' | 'Select'>;
    required: boolean;
    options?: string[];
    includeInAllWebcasts: boolean;
}

/** @category Webcasts */
export namespace RegistrationField {
    export interface Request {
        name: string;
        /** @default: text */
        fieldType?: LiteralString<'Text' | 'Select'>;
        /** @default: false */
        required?: boolean;
        options?: string[];
        includeInAllWebcasts?: boolean;
    }
}

/**
 * Returns basic information about a Rev tenant.
 * @category Utilities
 */
export interface AccountBasicInfo {
    account: {
        /**
         * AccountID
         */
        id: string;
        /**
         * Account Name
         */
        name?: string;
        /**
         * Default language
         */
        language?: string;
        /**
         * Timezone of account (used in calculating video expiration/publish dates)
         */
        timezone?: string;
    },
    environment: {
        /**
         * Semantic version of the Rev environment (ex. "8.0.5.102")
         */
        version: `${'7' | '8'}.${number}.${number}.${number}`;
    }
}
