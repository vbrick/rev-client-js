import { LiteralString } from './rev';

export type { Audit } from './audit';
export type { Auth } from './auth';
export type { Category } from './category';
export type { Channel } from './channel';
export type { Device } from './device';
export type { Group } from './group';
export type { Rev } from './rev';
export type { User } from './user';
export type { Video } from './video';
export type { Playlist } from './playlist';
export type { Recording } from './recording';
export type { Webcast } from './webcast';
export type { Zone } from './zone';

export type AccessControlEntityType = 'User' | 'Group' | 'Role' | 'Channel';

export interface AccessControlEntity {
    id: string;
    name: string;
    type: AccessControlEntityType;
    canEdit: boolean;
}

export interface CustomField {
    id: string;
    name: string;
    value: any;
    required: boolean;
    displayedToUsers: boolean;
    type: string;
    fieldType: string;
}

export interface BrandingSettings {
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

export interface Role {
    id: string;
    name: Role.RoleName;
}

export namespace Role {
    export type RoleName = LiteralString<'Account Admin' | 'Media Admin' | 'Media Contributor' | 'Media Viewer' | 'Event Admin' | 'Event Host' | 'Channel Creator' | 'Category Creator'>;
    export type Details = Role & { description: string; };
}
