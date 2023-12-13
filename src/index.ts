export * from './rev-client';
export {
    RevError,
    ScrollError
} from './rev-error';
export type {
    AccessControl,
    Admin,
    Audit,
    Auth,
    Category,
    Channel,
    Device,
    ExternalAccess,
    Group,
    GuestRegistration,
    OAuth,
    Rev,
    Role,
    User,
    Video,
    Playlist,
    Recording,
    RegistrationField,
    Webcast,
    Zone

} from './types';

export {RateLimitEnum} from './utils';

import {rateLimit} from './utils';
import {getExtensionForMime, getMimeForExtension} from './utils/file-utils'
export const utils = {
    rateLimit,
    getExtensionForMime,
    getMimeForExtension
};

import { RevClient } from './rev-client';
export default RevClient;
