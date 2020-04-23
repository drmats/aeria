/**
 * Aeria.
 *
 * Flightlog.
 *
 * @module aeria-app
 * @license Apache-2.0
 */




import getopts from "getopts"
import { map as asyncMap } from "@xcmats/js-toolbox/async"
import {
    choose,
    rearg,
} from "@xcmats/js-toolbox/func"
import {
    nl,
    padLeft,
    quote,
    space,
} from "@xcmats/js-toolbox/string"
import {
    objectMap,
    objectReduce,
} from "@xcmats/js-toolbox/struct"
import {
    isArray,
    toBool,
} from "@xcmats/js-toolbox/type"
import {
    DateTime,
    Duration,
} from "luxon"
import { promises as fsp } from "fs"




// ...
let
    // eslint-disable-next-line no-console
    print = console.info,




    // async.map argument rearranged and curried (helper)
    map = rearg(asyncMap)(1, 0),




    // convert duration represented as seconds
    // into duration represented as "hh:mm" string
    secondsToHoursMinutes = (seconds) =>
        Duration
            .fromObject({ seconds })
            .shiftTo("hours", "minutes")
            .toFormat("hh:mm"),




    // classify IGC line type
    classify = (line) =>
        toBool(line.match(/^HFDTE.*/)) ? "date" :
            toBool(line.match(/^B.*/)) ? "position" :
                "other",




    // parse IGC "HFDTE" record into Luxon's DateTime object
    parseDate = (line) => {
        // old date format
        let lm = line.match(
            /^HFDTE([0-9]{2})([0-9]{2})([0-9]{2})$/
        )
        if (!isArray(lm)) {
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




    // parse IGC "B" record
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




    // open IGC file, read its contents, split to lines,
    // parse interesting ones, produce simple summary
    parseIgc = async (filename) =>
        (await fsp.readFile(filename, "utf8"))
            .split("\r\n")
            .reduce(
                (acc, line) =>
                    choose(classify(line), {
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
                csv: "c",
            },
            boolean: ["h", "r", "t", "c"],
            string: ["span"],
            default: {
                help: false,
                span: "y",   // y - year, m - month, d - day
                raw: false,
                total: true,
                csv: false,
            },
        })


        // print help if desired
        if (options.help) {
            print([
                "usage:",
                "aeria [-s|--span=y|m|d]",
                "[-r|--raw] [--no-total]",
                "[--c|--csv]",
            ].join(space()))
            process.exit(0)
        }


        let
            // create per-file summaries
            // from all IGC files in current directory
            stats = await fsp
                .readdir(".", { withFileTypes: true })
                .then(entries =>
                    entries
                        .filter(entry => entry.isFile())
                        .filter(file => toBool(
                            file.name.toLowerCase().match(/\.igc$/)
                        ))
                        .map(file => file.name)
                )
                .then(map(parseIgc))
                .then(map(o => ({
                    date: o.date,
                    duration:
                        parsePoint(o.last).time.diff(
                            parsePoint(o.first).time, "seconds"
                        ).seconds,
                }))),

            // compute aggregated statistics based on per-file summaries
            aggregated = stats.reduce((acc, flight) => {
                let bucket = choose(
                    options.span, {
                        // aggregate by day
                        d: () => [
                            String(flight.date.year),
                            padLeft(String(flight.date.month), 2, "0"),
                            padLeft(String(flight.date.day), 2, "0"),
                        ].join("-"),
                        // aggregate by month
                        m: () => [
                            String(flight.date.year),
                            padLeft(String(flight.date.month), 2, "0"),
                        ].join("-"),
                    },
                    // aggregate by year (default)
                    () => String(flight.date.year)
                )
                if (acc[bucket]) {
                    acc[bucket].duration += flight.duration
                    acc[bucket].flights += 1
                } else {
                    acc[bucket] = {
                        duration: flight.duration,
                        flights: 1,
                    }
                }
                return acc
            }, {}),

            // result
            output = []


        // compute average flight time
        aggregated = objectMap(
            aggregated, ([k, { duration, flights, ...rest }]) => [k, {
                duration, flights, ...rest,
                average: Math.floor(duration / flights),
            }]
        )

        // compute totals
        if (options.total) {
            aggregated["TOTAL"] = objectReduce(
                aggregated,
                (acc, [_, v]) => ({
                    duration: acc.duration + v.duration,
                    flights: acc.flights + v.flights,
                }),
                { duration: 0, flights: 0 }
            )
            aggregated["TOTAL"].average = Math.floor(
                aggregated["TOTAL"].duration / aggregated["TOTAL"].flights
            )
        }

        // form an output (array of objects)
        output = Object
            // raw or human-readable durations
            .entries(options.raw ? aggregated : objectMap(
                aggregated, ([k, { average, duration, ...rest }]) => [k, {
                    duration: secondsToHoursMinutes(duration),
                    ...rest,
                    average: secondsToHoursMinutes(average),
                }]
            ))
            // { date, duration, flights, average, ...}
            .map(([k, v]) => ({ date: k, ...v }))
            // sort by date
            .sort(({ date: d1 }, { date: d2 }) =>
                d1 < d2 ? -1 : d1 > d2 ? 1 : 0
            )

        // shout it to the stdout
        if (output.length > 0  &&  options.csv) {
            print(
                ["date,duration,flights,average"]
                    .concat(
                        output.map(o => [
                            quote(o.date),
                            options.raw ? o.duration : quote(o.duration),
                            o.flights,
                            options.raw ? o.average : quote(o.average),
                        ].join(","))
                    )
                    .join(nl())
            )
        } else {
            print(output)
        }
    }




// ...
main()
