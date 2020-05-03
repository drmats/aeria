"use strict"




// ...
var conf = {
    presets: [
        [
            "@babel/preset-env",
            {
                modules: "commonjs",
                shippedProposals: true,
                targets: {
                    node: true,
                },
            },
        ],
        [
            "@babel/preset-typescript",
        ],
    ],
    plugins: [
        "@babel/plugin-proposal-class-properties",
        "@babel/plugin-transform-runtime",
    ],
    comments: false,
    shouldPrintComment: () => false,
}




// configuration
module.exports = function (api) {
    api.cache.using(() => process.env.BABEL_ENV)
    // eslint-disable-next-line no-console
    console.log(`Compiling for '${api.env()}' ...`)

    return {

        env: {

            // production environment
            production: conf,

            // development environment
            development: conf,

        },

    }
}
