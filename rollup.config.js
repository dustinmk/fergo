import path from "path";
import merge from "deepmerge";

import typescript from "rollup-plugin-typescript2";
import alias from "rollup-plugin-alias";
import copy from "rollup-plugin-copy-assets";
import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import {terser} from "rollup-plugin-terser";
import sourcemaps from "rollup-plugin-sourcemaps";

const production = !!process.env.PRODUCTION;

const makeConfig = (root_folder, name, extra) => {
  return merge({
    input: path.join(root_folder, "src", "index.ts"),
    output: {
      dir: path.join(root_folder, "dist"),
      format: "umd",
      name: name
    },
    plugins: [
      typescript({
          tsconfig: "./tsconfig.json",
          tsconfigOverride: {
            compilerOptions: {
              target: "ES2015",
              module: "ES2015",
              declarationDir: path.join(root_folder, "dist")
            }
          },
          objectHashIgnoreUnknownHack: true,
          useTsconfigDeclarationDir: true
      }),
      alias({
          resolve: [".ts", ".js"],
          "minim": "./src",
          "test": "./test",
          "minim-benchmark": "./benchmark/src",
          "minim-examples": "./examples/src"
      }),
      resolve(),
      commonjs(),
      production && terser()
    ]
  }, extra === undefined ? {} : extra)
}

export default [
  makeConfig(".", "minim"),

  makeConfig("./benchmark", "minim_benchmark", {
    output: {format: "iife", sourcemap: true},
    plugins: [
      copy({assets: ["benchmark/src/index.html"]}),
      sourcemaps()
    ]
  }),

  makeConfig("./examples", "minim_examples", {
    output: {format: "iife", sourcemap: true},
    plugins: [
      copy({assets: ["examples/src/index.html"]}),
      sourcemaps()
    ]
  })
]