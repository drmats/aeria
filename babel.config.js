"use strict"




// ...
var conf = {
    presets: [
        [
            "@babel/preset-env",
            {
                targets: {
                    node: true,
                },
            },
        ],
    ],
    plugins: [
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
