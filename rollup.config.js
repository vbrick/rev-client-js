import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';
import pkg from './package.json';

// `npm run build` -> `production` is true
// `npm run dev` -> `production` is false
//@ts-ignore
const production = !process.env.ROLLUP_WATCH;

export default [
    {
        input: 'src/index.ts',
        output: [
            {
                file: pkg.browser,
                format: 'es',
                sourcemap: true,
                exports: 'named'
            }
        ],
        plugins: [
            typescript(),
            resolve()
        ],
        external: [/node_modules/]
    },
    {
        input: 'src/index-node.ts',
        output: [
            {
                file: pkg.main,
                format: 'cjs',
                sourcemap: true,
                exports: 'named'
            },
            {
                file: pkg.module,
                format: 'es',
                sourcemap: true,
                exports: 'named'
            }
        ],
        plugins: [
            typescript(),
            resolve()
        ],
        external: [/node_modules/]
    },
    {
        input: 'src/index.ts',
        output: [
            {
                file: pkg.types,
                format: 'es'
            }
        ],
        plugins: [dts()]
    }
];
