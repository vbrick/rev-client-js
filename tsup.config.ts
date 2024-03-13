//@ts-check
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
    clean: true,
    dts: false,
    skipNodeModulesBundle: true
}

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
            ...fileEntry('src/index-node.ts', pkg.module),
            format: 'esm',
            platform: 'node',
            ...commonConfig
        },
        {
            ...fileEntry('src/index-node.ts', pkg.main),
            format: 'cjs',
            platform: 'node',
            ...commonConfig
        },
        {
            ...fileEntry('src/index-node18.ts', pkg.exports['./native-fetch'].node.import),
            format: 'esm',
            platform: 'node',
            ...commonConfig
        },
        {
            ...fileEntry('src/index-node18.ts', pkg.exports['./native-fetch'].node.require),
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
