"use strict"




// ...
const
    fs = require("fs"),
    path = require("path"),
    webpack = require("webpack"),
    MinifyPlugin = require("babel-minify-webpack-plugin"),
    appDirectory = fs.realpathSync(process.cwd()),
    nodeExternals = require("webpack-node-externals")




// ...
module.exports = {

    mode: "production",


    target: "node",


    externals: [nodeExternals({
        whitelist: [
            /@babel\/runtime(\/.*)?/,
            /@xcmats\/js-toolbox(\/.*)?/,
        ],
    })],


    entry: {
        "aeria": path.resolve(
            appDirectory, "src/index.js"
        ),
    },


    output: {
        filename: "[name].js",
        chunkFilename: "[name].c.js",
        path: path.resolve(__dirname, "./dist"),
        libraryTarget: "commonjs",
        globalObject: "this",
    },


    optimization: {
        minimize: true,
        mergeDuplicateChunks: true,
        sideEffects: false,
        providedExports: true,
        concatenateModules: true,
        occurrenceOrder: true,
        removeEmptyChunks: true,
        removeAvailableModules: true,
        minimizer: [
            new MinifyPlugin({}, {
                comments: false,
            }),
        ],
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
                exclude: /node_modules/,
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
    ],

}
