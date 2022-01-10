/**
 * Bundle configuration.
 *
 * @module @xcmats/webpack-backend-config
 * @license BSD-2-Clause
 * @copyright Mat. 2019-present
 */

"use strict";




// ...
const

    webpack = require("webpack"),
    { realpathSync } = require("fs"),
    { resolve } = require("path"),
    MinifyPlugin = require("terser-webpack-plugin"),
    ESLintPlugin = require("eslint-webpack-plugin"),
    nodeExternals = require("webpack-node-externals"),
    appName = require("./package.json").name,
    appDirectory = realpathSync(process.cwd());




// ...
module.exports = {

    mode: "production",


    target: "node",


    resolve: {
        extensions: [".ts", ".js"],
    },


    externals: [nodeExternals({
        allowlist: [
            /@xcmats\/js-toolbox(\/.*)?/,
        ],
    })],


    entry: {
        [appName.split("/")[1]]: resolve(appDirectory, "src/index.js"),
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
        chunkIds: "total-size",
        moduleIds: "size",
        providedExports: true,
        removeAvailableModules: true,
        removeEmptyChunks: true,
        sideEffects: true,
    },


    module: {
        rules: [
            {
                test: /\.(js|ts)$/,
                loader: "babel-loader",
                sideEffects: false,
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
        new ESLintPlugin({
            context: "src",
        }),
    ],

};
