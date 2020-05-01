"use strict"




// ...
const
    { realpathSync } = require("fs"),
    { resolve } = require("path"),
    webpack = require("webpack"),
    MinifyPlugin = require("terser-webpack-plugin"),
    appDirectory = realpathSync(process.cwd())




// ...
module.exports = {

    mode: "production",


    target: "node",


    entry: {
        "aeria": resolve(appDirectory, "src/index.js"),
    },


    output: {
        chunkFilename: "[name].c.js",
        filename: "[name].js",
        globalObject: "this",
        libraryTarget: "commonjs",
        path: resolve(__dirname, "./dist"),
    },


    optimization: {
        concatenateModules: true,
        mergeDuplicateChunks: true,
        minimize: true,
        minimizer: [
            new MinifyPlugin({
                terserOptions: {
                    output: {
                        comments: false,
                    },
                },
                extractComments: false,
            }),
        ],
        occurrenceOrder: true,
        providedExports: true,
        removeAvailableModules: true,
        removeEmptyChunks: true,
        sideEffects: true,
    },


    module: {
        rules: [
            {
                enforce: "pre",
                test: /\.js$/,
                exclude: /node_modules/,
                loader: "eslint-loader",
            },
            {
                test: /\.js$/,
                loader: "babel-loader",
                sideEffects: true,
            },
        ],
    },


    node: {
        __dirname: false,
        __filename: false,
    },


    plugins: [
        new webpack.DefinePlugin({
            "process.env.BABEL_ENV": JSON.stringify("production"),
        }),
    ],

}
