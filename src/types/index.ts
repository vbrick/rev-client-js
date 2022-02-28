import { LiteralString } from './rev';

export type { AccessControl } from './access-control';
export type { Admin } from './admin';
export type { Audit } from './audit';
export type { Auth, OAuth } from './auth';
export type { Category } from './category';
export type { Channel } from './channel';
export type { Device } from './device';
export type { Group } from './group';
export type { Rev } from './rev';
export type { User } from './user';
export type { Video } from './video';
export type { Playlist } from './playlist';
export type { Recording } from './recording';
export type { Webcast, GuestRegistration } from './webcast';
export type { Zone } from './zone';


export interface Role {
    id: string;
    name: Role.RoleName;
}

export namespace Role {
    export type RoleName = LiteralString<'Account Admin' | 'Media Admin' | 'Media Contributor' | 'Media Viewer' | 'Event Admin' | 'Event Host' | 'Channel Creator' | 'Category Creator'>;
    export type Details = Role & { description: string; };
}

export interface RegistrationField {
    id: string;
    name: string;
    fieldType: LiteralString<'Text' | 'Select'>;
    required: boolean;
    options?: string[];
    includeInAllWebcasts: boolean;
}

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
