//@ts-check
import fs from 'node:fs/promises';
import { Options, defineConfig } from 'tsup';
import pkg from './package.json';
import path from 'node:path';

function fileEntry(source: string, filepath: string): Partial<Options> {
    const {name, dir, ext} = path.parse(filepath);
    return {
        entry: { [name]: source },
        outDir: dir,
        outExtension: ctx => ({ js: ext })
    };
}

const commonConfig: Options = {
    splitting: false,
    sourcemap: true,
    dts: false,
    clean: false,
    skipNodeModulesBundle: true
}

console.log('clearing dist directory');
await fs.rm('./dist', { recursive: true, force: true });

export default defineConfig((options) => {
    const cfg: Options[] = [
        {
            ...fileEntry('src/index.ts', pkg.browser),
            format: 'esm',
            platform: 'browser',
            ...commonConfig,
            dts: true
        },
        {
            ...fileEntry('src/index-nodefetch.mts', pkg.exports['./node-fetch'].node.import),
            format: 'esm',
            platform: 'node',
            ...commonConfig
        },
        {
            ...fileEntry('src/index-nodefetch.cts', pkg.exports['./node-fetch'].node.require),
            format: 'cjs',
            platform: 'node',
            ...commonConfig
        },
        {
            ...fileEntry('src/index-node-native.ts', pkg.exports['./native-fetch'].node.import),
            format: 'esm',
            platform: 'node',
            ...commonConfig
        },
        {
            ...fileEntry('src/index-node-native.ts', pkg.exports['./native-fetch'].node.require),
            format: 'cjs',
            platform: 'node',
            ...commonConfig
        },
        {
            ...fileEntry('src/index.ts', pkg.exports['./iife']),
            format: 'iife',
            platform: 'browser',
            globalName: 'revClientLib',
            ...commonConfig,
            minify: true,
            dts: false
        }
    ];
    return cfg;
});
