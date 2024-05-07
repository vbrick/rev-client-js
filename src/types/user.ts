import { Role } from '.';
import { Rev } from './rev';
import { LiteralString } from './rev';

export interface User {
    userId: string;
    username: string;
    email: string;
    firstname: string;
    lastname: string;
    language: string | null;
    userType: User.UserType;
    title: string | null;
    phone: string | null;
    groups: { id: string, name: string; }[] | null;
    roles: Role[];
    channels: { id: string, name: string; }[] | null;
    profileImageUri: string | null;
    permissions: User.Permissions;
    status: User.UserStatus;
}

export namespace User {

    export interface SearchHit {
        userId: string;
        email: string | null;
        entityType: 'User';
        firstname: string;
        lastname: string;
        username: string;
        profileImageUri: string;
    }

    export interface RawSearchHit {
        Id: string;
        Email: string | null;
        EntityType: 'User';
        FirstName: string;
        LastName: string;
        UserName: string;
        ProfileImageUri: string;
    }

    export interface Request {
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

    export type DetailsLookup = LiteralString<'username' | 'email' | 'userId'>

    export interface Permissions {
        canUpload: boolean
        canCreateEvents: boolean
        canCreatePublicWebcasts: boolean
        canCreateAllUsersWebcasts: boolean
        canCreatePublicVods: boolean
        canCreateAllUsersVods: boolean
    }

    export interface Notification {
        notificationId: string;
        notificationDate: string;
        notificationType: string;
        isRead: boolean;
        notificationText: string;
        notificationTargetUri: string;
    }

    export type UserType = LiteralString<'System' | 'LDAP' | 'Sso' | 'SCIM'>

    export type UserStatus = LiteralString<'Suspended' | 'Unlicensed' | 'AwaitingConfirmation' | 'AwaitingPasswordReset' | 'AwaitingSecurityQuestionReset' | 'LockedOut' | 'Active'>;

    export type LoginReportSort = LiteralString<'LastLogin' | 'Username'>
    export interface LoginReportEntry {
        Username: string;
        FullName: string;
        UserId: string;
        LastLogin: string;
    }
}
