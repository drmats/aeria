/**
 * Aeria.
 *
 * IGC parsing routines.
 *
 * @module aeria-app
 * @license Apache-2.0
 */




import { empty } from "@xcmats/js-toolbox/string"
import {
    isArray,
    toBool,
} from "@xcmats/js-toolbox/type"
import { DateTime } from "luxon"




/**
 * Classify IGC line type.
 */
export const classify = (line: string): string =>
    toBool(line.match(/^HFDTE.*/)) ? "date" :
        toBool(line.match(/^B.*/)) ? "position" :
            "other"




/**
 * Parse IGC "HFDTE" record into Luxon's DateTime object.
 */
export const parseDate = (line: string): object => {
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

    if (lm) {
        return DateTime.fromObject({
            day: parseInt(lm[1], 10),
            month: parseInt(lm[2], 10),
            year: parseInt(`20${lm[3]}`, 10),
        })
    } else
        throw new Error(`Unrecognized date record: ${line}`)
}




/**
 * Parse IGC "B" record.
 *
 * B HH MM SS DDMMmmm [NS] DDDMMmmm [EW] [AV] PPPPP GGGGG
 */
export const parsePoint = (line: string): object => {

    let
        dd = "([0-9]{2})",
        ddd = "([0-9]{3})",
        lm = line.match(new RegExp([
            "^B",                       // type
            `${dd}${dd}${dd}`,          // time
            `${dd}${dd}${ddd}([NS])`,   // lat
            `${ddd}${dd}${ddd}([EW])`,  // lon
            "([AV])",                   // fix
            "([0-9]{5}|-[0-9]{4})",     // pressure alt
            "([0-9]{5})",               // alt
        ].join(empty())))

    if (lm) {
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
    } else
        throw new Error(`Unrecognized point record: ${line}`)
}
