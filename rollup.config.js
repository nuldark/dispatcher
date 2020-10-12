import pkg from './package.json'
import commonjs from '@rollup/plugin-commonjs'
import { terser } from 'rollup-plugin-terser'

export default [
    {
        input: 'src/index.js',
        output: { 
            file: pkg.main, 
            format: 'cjs'
        },
        external: ['amqplib'],
        plugins: [
            commonjs(),
            terser()
        ]
    }
]