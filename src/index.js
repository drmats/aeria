/**
 * Aeria.
 *
 * Flightlog.
 *
 * @module aeria-app
 * @license Apache-2.0
 */




import getopts from "getopts"
import {
    async,
    func,
    string,
    struct,
    type,
} from "@xcmats/js-toolbox"
import {
    DateTime,
    Duration,
} from "luxon"
import { promises as fsPromises } from "fs"




// ...
let
    // eslint-disable-next-line no-console
    print = console.info,




    // ...
    map = func.rearg(async.map)(1, 0),




    // ...
    secondsToHours = (seconds) =>
        Duration
            .fromObject({ seconds })
            .shiftTo("hours", "minutes")
            .toFormat("hh:mm"),




    // ...
    classify = (line) =>
        type.toBool(line.match(/^HFDTE.*/)) ? "date" :
            type.toBool(line.match(/^B.*/)) ? "position" :
                "other",




    // ...
    parseDate = (line) => {
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

        return DateTime.fromObject({
            day: parseInt(lm[1], 10),
            month: parseInt(lm[2], 10),
            year: parseInt(`20${lm[3]}`, 10),
        })
    },




    // ...
    parsePoint = (line) => {
        // B HH MM SS DDMMmmm [NS] DDDMMmmm [EW] [AV] PPPPP GGGGG
        let
            dd = "([0-9]{2})",
            ddd = "([0-9]{3})",
            lm = line.match(new RegExp(
                "^B" +                       // type
                `${dd}${dd}${dd}` +          // time
                `${dd}${dd}${ddd}([NS])` +   // lat
                `${ddd}${dd}${ddd}([EW])` +  // lon
                "([AV])" +                   // fix
                "([0-9]{5}|-[0-9]{4})" +     // pressure alt
                "([0-9]{5})"                 // alt
            ))

        return {
            time: DateTime.fromObject({
                hour: parseInt(lm[1], 10),
                minute: parseInt(lm[2], 10),
                second: parseInt(lm[3], 10),
            }),
            lat: {
                d: parseInt(lm[4], 10),
                m: parseInt(lm[5], 10),
                s: parseInt(lm[6], 10),
                o: lm[7],
            },
            lon: {
                d: parseInt(lm[8], 10),
                m: parseInt(lm[9], 10),
                s: parseInt(lm[10], 10),
                o: lm[11],
            },
            fix: lm[12],
            palt: parseInt(lm[13], 10),
            alt: parseInt(lm[14], 10),
        }
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
                                date: () => {
                                    acc.date = parseDate(line)
                                    return acc
                                },
                                position: () => {
                                    if (acc.first === null) {
                                        acc.first = line
                                    }
                                    acc.last = line
                                    return acc
                                },
                            }, () => acc),
                        {
                            date: null,
                            first: null,
                            last: null,
                        }
                    )
            ),




    // ...
    main = async () => {

        // program options
        const options = getopts(process.argv.slice(2), {
            alias: {
                help: "h",
                raw: "r",
                span: "s",
                total: "t",
            },
            boolean: ["h", "r", "t"],
            string: ["span"],
            default: {
                help: false,
                span: "y",
                raw: false,
                total: true,
            },
        })

        if (options.help) {
            print("usage: aeria [-s|--span=y|m|d] [-r|--raw] [--no-total]")
            process.exit(0)
        }

        let
            // per-file statistics
            stats = await fsPromises
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
                    date: o.date,
                    duration:
                        parsePoint(o.last).time.diff(
                            parsePoint(o.first).time, "seconds"
                        ).seconds,
                }))),

            // computed statistics
            computedStats = stats.reduce((acc, flight) => {
                let bucket = func.choose(options.span, {
                    d: () => [
                        String(flight.date.year),
                        string.padLeft(String(flight.date.month), 2, "0"),
                        string.padLeft(String(flight.date.day), 2, "0"),
                    ].join("-"),
                    m: () => [
                        String(flight.date.year),
                        string.padLeft(String(flight.date.month), 2, "0"),
                    ].join("-"),
                }, () => String(flight.date.year))
                if (acc[bucket]) { acc[bucket] += flight.duration }
                else { acc[bucket] = flight.duration }
                return acc
            }, {}),

            // output
            output = options.raw ? computedStats : struct.objectMap(
                computedStats, ([k, v]) => [k, secondsToHours(v)]
            )


        if (options.total) {
            output["TOTAL"] = func.flow(
                options.raw ? func.identity : secondsToHours
            )(struct.objectReduce(
                computedStats, (acc, [_, v]) => acc + v, 0
            ))
        }

        print(output)
    }




// ...
main()
