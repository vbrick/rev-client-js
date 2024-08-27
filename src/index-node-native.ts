export * from './index';
export type * from './index';

import { setPolyfills } from './interop/polyfills';
import nodePolyfillsCallback from './interop/node-polyfills';

setPolyfills(nodePolyfillsCallback);
