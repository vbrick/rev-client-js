export * from './index';
export type * from './index';

import { setPolyfills } from './interop/polyfills';
import nodePolyfillsCallback from './interop/node-polyfills';
import nodeFetchPolyfillCallback from './interop/node-fetch-polyfills'

setPolyfills(nodePolyfillsCallback);
setPolyfills(nodeFetchPolyfillCallback);
