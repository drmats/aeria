"use strict"




// configuration
module.exports = function (api) {
    api.cache.using(() => process.env.BABEL_ENV)
    // eslint-disable-next-line no-console
    console.log(`Compiling for '${api.env()}' ...`)

    return {

        env: {

            // production environment
            production: {
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
                comments: false,
                shouldPrintComment: () => false,
            },

        },

    }
}
