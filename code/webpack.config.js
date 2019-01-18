const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");

// TODO: Closure Compiler

module.exports = [
    {
        mode: "development",
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
        }
    },
    {
        mode: "development",
        entry: "./examples/index.ts",
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
                example: path.resolve(__dirname, "example")
            }
        },
        output: {
            filename: `index.js`,
            path: path.resolve(__dirname, "example_dist")
        },
        plugins: [
            new CopyWebpackPlugin([
                "examples/index.html"
            ])
        ]
    }
]