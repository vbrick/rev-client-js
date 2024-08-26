export * from './index';
export type * from './index';

import { setPolyfills } from './interop/polyfills';
import nodePolyfillsCallback from './interop/node-polyfills';
import nodeFetchPolyfills from './interop/node-fetch-commonjs';

setPolyfills(nodePolyfillsCallback);
setPolyfills(nodeFetchPolyfills);
