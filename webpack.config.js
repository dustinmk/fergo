const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const merge = require("deepmerge");
const nodeExternals = require("webpack-node-externals");

const buildConfig = (root_dir, entry, output, copy_files) => {
    const plugins = copy_files.length > 0
        ? [new CopyWebpackPlugin({patterns: copy_files})]
        : [];

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
                fergo: path.resolve(__dirname, "src"),
                "fergo-examples": path.resolve(__dirname, "examples", "src"),
                "fergo-benchmark": path.resolve(__dirname, "benchmark", "src"),
            }
        },
        output: {
            filename: output,
            path: path.resolve(__dirname, root_dir, "dist")
        },
        plugins,
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
    {...buildConfig("examples", "index.ts", "index.js", ["examples/src/index.html"]), ...{
        devServer: {
            contentBase: path.join(__dirname, "examples/dist"),
            compress: true,
            port: 8080
        },
    }},
    {...buildConfig("benchmark", "runner.ts", "runner.js", [
        {
            from: "./node_modules/benchmark/benchmark.js",
            to: "benchmark.js"
        },
        {
            from: "./node_modules/lodash/lodash.js",
            to: "lodash.js"
        }
    ]), ...{
        externals: ["benchmark", "lodash"]
    }},
    buildConfig("benchmark", "results.ts", "results.js", []),
    {...buildConfig("benchmark", "server.ts", "server.js", ["benchmark/src/index.html.mustache"]), ...{
        target: "node",
        externals: [nodeExternals()],
        node: {
            __dirname: false,
            __filename: false
        }
    }},
]