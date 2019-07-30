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
} from "@xcmats/js-toolbox"
import { DateTime } from "luxon"
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
    map = func.rearg(async.map)(1, 0),


    // ...
    classify = (line) =>
        type.toBool(line.match(/^HFDTE.*/)) ? "date" :
            type.toBool(line.match(/^B.*/)) ? "position" :
                "other",


    // ...
    parseDate = (acc, line) => {
        // old date format
        let lm = line.match(
            /^HFDTE([0-9]{2})([0-9]{2})([0-9]{2})$/
        )
        if (!type.isArray(lm)) {
            // new date format
            lm = line.match(
                /^HFDTEDATE:([0-9]{2})([0-9]{2})([0-9]{2}),.*$/
            )
        }

        try {
            acc.day = {
                d: parseInt(lm[1], 10),
                m: parseInt(lm[2], 10),
                y: parseInt(`20${lm[3]}`, 10),
            }
        } catch {
            acc.date = "unknown"
        }

        return acc
    },


    // ...
    parsePoint = (acc, line) => {
        acc.points += 1
        if (acc.first === null) {
            acc.first = line
        }
        acc.last = line
        return acc
    },


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
                                date: parseDate,
                                position: parsePoint,
                            }, () => acc, [acc, line]),
                        {
                            day: null,
                            points: 0,
                            first: null,
                            last: null,
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
            .then(map(parseIgc))
            .then(map(o => ({
                lux: DateTime.fromObject({
                    year: o.day.y,
                    month: o.day.m,
                    day: o.day.d,

                }).toISODate(),
                ...o,
            })))
            .then(map(print))

    }




// ...
main()
