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
import { toBool } from "@xcmats/js-toolbox/type"
import { Duration } from "luxon"
import { promises as fsp } from "fs"
import { parseFile } from "./igc.ts"
import {
    calculateAllStats,
    calculateDuration,
} from "./flight_stats.ts"




// ...
let
    // eslint-disable-next-line no-console
    print = console.info,




    // async.map argument rearranged and curried (helper)
    map = rearg(asyncMap) (1, 0),




    // pretty-print helper
    pad = rearg(padLeft) (2, 1, 0) (space(), 15),




    // convert duration represented as seconds
    // into duration represented as "hh:mm" string
    secondsToHoursMinutes = (seconds) =>
        Duration
            .fromObject({ seconds })
            .shiftTo("hours", "minutes")
            .toFormat("hh:mm"),




    // get array of igc filenames in given directory
    getIgcFilenames = async directory =>
        (await fsp.readdir(directory, { withFileTypes: true }))
            .filter(entry =>
                entry.isFile() && toBool(
                    entry.name.toLowerCase().match(/\.igc$/)
                )
            )
            .map(file => file.name),




    // create per-file summaries
    // from all IGC files in a given directory
    computeSummaryStats = async directory =>
        await map(
            async igcFilename => {
                print(igcFilename)
                let igc = await parseFile(igcFilename)
                return {
                    name: igc.name,
                    date: igc.date,
                    duration: calculateDuration(igc.points),
                }
            }
        ) (await getIgcFilenames(directory)),




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
                file: "f",
            },
            boolean: ["h", "r", "t", "c"],
            string: ["span", "file"],
            default: {
                help: false,
                span: "y",   // y - year, m - month, d - day
                raw: false,
                total: true,
                csv: false,
                file: null,
            },
        })


        // print help if desired
        if (options.help) {
            print([
                "usage:",
                "aeria [-s|--span=y|m|d]",
                "[-r|--raw] [--no-total]",
                "[-c|--csv]",
                "[-f|--file=FILE]",
            ].join(space()))
            return process.exit(0)
        }


        try {

            // single-file stats printer
            if (options.file) {

                let
                    igc = await parseFile(options.file),
                    stats = calculateAllStats(igc)

                print(
                    pad("name:"),
                    igc.name
                )
                print(
                    pad("date:"),
                    igc.date.toISODate()
                )
                print(
                    pad("points:"),
                    igc.points.length
                )
                print(
                    pad("duration:"),
                    secondsToHoursMinutes(stats.duration)
                )
                print(
                    pad("max alt. gain:"),
                    stats.maxAltGain
                )

                return

            }


            let

                // compute stats
                stats = await computeSummaryStats("."),

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

            // ...
            print()

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

        // deal with (async) errors
        } catch (ex) {
            print(ex)
            process.exit(-1)
        }

    }




// ...
main()
