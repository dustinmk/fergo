const path = require("path");

// TODO: Closure Compiler

const example_base = (name) => ({
    mode: "development",
    entry: `./src/example/${name}.ts`,
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
        filename: `${name}.js`,
        path: path.resolve(__dirname, "src", "example")
    }
});

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
    example_base("pubsub"),
    example_base("todo"),
    example_base("benchmark"),
    example_base("closure"),
    example_base("state")
]