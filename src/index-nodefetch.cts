export * from './index';
export type * from './index';

const { setPolyfills } = require('./interop/polyfills');
const { nodePolyfillsCallback } = require('./interop/node-polyfills');
const { nodeFetchPolyfills } = require('./interop/node-fetch-commonjs');

setPolyfills(nodePolyfillsCallback);
setPolyfills(nodeFetchPolyfills);