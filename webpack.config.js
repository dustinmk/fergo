const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const merge = require("deepmerge");
const nodeExternals = require("webpack-node-externals");

const buildConfig = (root_dir, entry, output, copy_files) => {
    return {
        target: "web",
        mode: "development",
        entry: path.resolve(__dirname, root_dir, "src", entry),
        devtool: "inline-source-map",
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
            extensions: [".tsx", ".ts", ".jsx", ".js", ".html", ".css"],
            alias: {
                minim: path.resolve(__dirname, "src"),
                "minim-examples": path.resolve(__dirname, "examples", "src"),
                "minim-benchmark": path.resolve(__dirname, "benchmark", "src"),
            }
        },
        output: {
            filename: output,
            path: path.resolve(__dirname, root_dir, "dist")
        },
        plugins: [
            new CopyWebpackPlugin(copy_files)
        ]
    }
}

module.exports = [
    buildConfig("examples", "krausest.js", "krausest.js", [
        "examples/src/krausest.html",
        "examples/src/krausest.css",
        "examples/src/bootstrap.css",
        "examples/src/main.css"
    ]),
    buildConfig("examples", "examples/router-example.ts", "examples/router-example.js", ["examples/src/router-example.html"]),
    buildConfig("examples", "index.ts", "index.js", ["examples/src/index.html"]),
    merge(buildConfig("benchmark", "runner.ts", "runner.js", [
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
    buildConfig("benchmark", "results.ts", "results.js", []),
    merge(buildConfig("benchmark", "server.ts", "server.js", ["benchmark/src/index.html.mustache"]), {
        target: "node",
        externals: [nodeExternals()],
        node: {
            __dirname: false,
            __filename: false
        }
    }),
]