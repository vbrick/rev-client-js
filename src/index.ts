export * from './rev-client';
export * from './rev-error';
export type * from './types';

import {rateLimit} from './utils';
import {getExtensionForMime, getMimeForExtension} from './utils/file-utils';
import { setPolyfills } from './interop/polyfills';
/**
 * Includes some helper utilities that may be useful when using this library
 * @category Utilities
 * @interface
 */
export const utils = {
    /**
     * Rate-limit a function - useful to throttle the number of API requests made in a minute
     * @example
     * ```js
     * const {utils} = import '@vbrick/rev-client'
     * const lock = utils.rateLimit(() => {}, { perSecond: 1 });
     * for (let i = 0; i < 10; i++) {
     *   await lock();
     *   console.log(`${i}: this will only be called once per second`);
     * }
     * ```
     */
    rateLimit,
    /**
     * Get a valid file extension for a given mimetype (used for uploading videos/transcriptions/etc)
     */
    getExtensionForMime,
    /**
     * Get a valid mimetype for a given file extension (used for uploading videos/transcriptions/etc)
     */
    getMimeForExtension,
    /**
     * ADVANCED - Override the underlying classes used in making requests. This is for internal use only and shouldn't typically be used.
     */
    setPolyfills
};

import { RevClient } from './rev-client';
export default RevClient;
