/**
 * Aeria.
 *
 * Flightlog.
 *
 * @module aeria-app
 * @license Apache-2.0
 */




import {
    async,
    func,
    type,
    string,
} from "@xcmats/js-toolbox"
import { promises as fsPromises } from "fs"
import {
    name as applicationName,
    version,
} from "../package.json"




// ...
let
    // eslint-disable-next-line no-console
    print = console.info,


    // ...
    classify = (line) =>
        type.toBool(line.match(/^HFDTE.*/)) ? "date" :
            type.toBool(line.match(/^B.*/)) ? "position" :
                "other",


    // ...
    parseIgc = (filename) =>
        fsPromises
            .readFile(filename, "utf8")
            .then(contents =>
                contents
                    .split("\r\n")
                    .reduce(
                        (acc, line) =>
                            func.choose(classify(line), {
                                date: () => {
                                    acc.date = line
                                    return acc
                                },
                                position: () => {
                                    acc.seconds += 1
                                    return acc
                                },
                            }, () => acc),
                        {
                            date: string.empty(),
                            seconds: 0,
                        }
                    )
            ),


    // ...
    main = () => {

        print(`${applicationName} v.${version}`)

        fsPromises
            .readdir(".", { withFileTypes: true })
            .then(func.flow(
                entries =>
                    entries
                        .filter(entry => entry.isFile())
                        .filter(file => type.toBool(
                            file.name.toLowerCase().match(/\.igc$/)
                        ))
                        .map(file => file.name),
                entries => { let s = entries.slice().sort(); return s }
            ))
            .then(func.rearg(async.map)(1, 0)(parseIgc))
            .then(print)

    }




// ...
main()
