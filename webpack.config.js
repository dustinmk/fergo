const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const merge = require("deepmerge");
const nodeExternals = require("webpack-node-externals");

const buildConfig = (root_dir, entry, copy_files) => {
    return {
        mode: "development",
        entry: path.resolve(__dirname, root_dir, "src", `${entry}.ts`),
        devtool: "source-map",
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    use: "ts-loader",
                    exclude: /node_modules/
                },
                {
                    test: /\.html$/,
                    use: "file-loader",
                    exclude: /node_modules/,
                }
            ]
        },
        resolve: {
            extensions: [".tsx", ".ts", ".jsx", ".js", ".html"],
            alias: {
                minim: path.resolve(__dirname, "src"),
                "minim-examples": path.resolve(__dirname, "examples", "src"),
                "minim-benchmark": path.resolve(__dirname, "benchmark", "src"),
            }
        },
        output: {
            filename: `${entry}.js`,
            path: path.resolve(__dirname, root_dir, "dist")
        },
        plugins: [
            new CopyWebpackPlugin(copy_files)
        ]
    }
}

module.exports = [
    buildConfig("examples", "index", ["examples/src/index.html"]),
    merge(buildConfig("benchmark", "runner", [
        {
            from: "./node_modules/benchmark/benchmark.js",
            to: "benchmark.js"
        },
        {
            from: "./node_modules/lodash/lodash.js",
            to: "lodash.js"
        }
    ]), {
        externals: ["benchmark", "lodash"]
    }),
    buildConfig("benchmark", "results", []),
    merge(buildConfig("benchmark", "server", ["benchmark/src/index.html.mustache"]), {
        target: "node",
        externals: [nodeExternals()],
        node: {
            __dirname: false,
            __filename: false
        }
    }),
]