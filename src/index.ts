export * from './rev-client';
export * from './rev-error';
export type * from './types';

import {rateLimit} from './utils';
import {getExtensionForMime, getMimeForExtension} from './utils/file-utils';
import { setPolyfills } from './interop/polyfills';
export const utils = {
    rateLimit,
    getExtensionForMime,
    getMimeForExtension,
    setPolyfills
};

import { RevClient } from './rev-client';
export default RevClient;
