export * from './rev-client';
export * from './rev-error';
export type * from './types';

import {rateLimit} from './utils';
import {getExtensionForMime, getMimeForExtension} from './utils/file-utils'
export const utils = {
    rateLimit,
    getExtensionForMime,
    getMimeForExtension
};

import { RevClient } from './rev-client';
export default RevClient;

import './interop/node18-polyfills';
