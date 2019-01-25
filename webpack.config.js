const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const DefinePlugin = require("webpack").DefinePlugin;

// TODO: Closure Compiler

const mode = "development";

module.exports = [
    {
        mode,
        entry: "./src/index.ts",
        devtool: "source-map",
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    use: "ts-loader",
                    exclude: /node_modules/
                }
            ]
        },
        resolve: {
            extensions: [".tsx", ".ts", ".jsx", ".js"],
            alias: {
                src: path.resolve(__dirname, "src")
            }
        },
        output: {
            filename: "index.js",
            path: path.resolve(__dirname, "dist")
        },
        plugins: [
            new DefinePlugin({
                "DEBUG": mode === "development"
            })
        ]
    },
    {
        mode,
        entry: "./examples/src/index.ts",
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
                src: path.resolve(__dirname, "src"),
                examples: path.resolve(__dirname, "examples", "src")
            }
        },
        output: {
            filename: `index.js`,
            path: path.resolve(__dirname, "examples", "dist")
        },
        plugins: [
            new CopyWebpackPlugin([
                "examples/src/index.html"
            ]),
            new DefinePlugin({
                "DEBUG": mode === "development"
            })
        ]
    }
]