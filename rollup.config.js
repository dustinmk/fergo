import typescript from 'rollup-plugin-typescript2';
import alias from 'rollup-plugin-alias';
import compiler from '@ampproject/rollup-plugin-closure-compiler';

export default {
  input: './src/index.ts',
  output: {
    dir: "./dist",
    format: "umd",
    name: "minim"
  },
  plugins: [
    typescript({
        tsconfig: "./tsconfig.json",
        tsconfigOverride: {
          target: "ES2015",
          module: "ES2015"
        },
        objectHashIgnoreUnknownHack: true
    }),
    alias({
        resolve: [".ts", ".js"],
        "src": "./src"
    }),
    compiler()
  ]
}