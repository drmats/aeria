/**
 * Aeria.
 *
 * IGC parsing routines.
 *
 * @module aeria-app
 * @license Apache-2.0
 */




import { promises as fsp } from "fs";
import {
    head,
    last,
} from "@xcmats/js-toolbox/array";
import { empty } from "@xcmats/js-toolbox/string";
import { isArray } from "@xcmats/js-toolbox/type";
import { DateTime } from "luxon";




/**
 * IGC record type.
 */
export enum IGCRecordType {
    Date,
    Position,
    Other,
}




/**
 * Classify IGC line type.
 */
export const classify = (line: string): IGCRecordType => {

    if (line.match(/^HFDTE.*/)) return IGCRecordType.Date;
    if (line.match(/^B.*/)) return IGCRecordType.Position;
    return IGCRecordType.Other;

};




/**
 * Parse IGC "HFDTE" record into Luxon's DateTime object.
 */
export const parseDate = (line: string): DateTime => {

    // old date format ...
    let lm = line.match(/^HFDTE([0-9]{2})([0-9]{2})([0-9]{2})$/);

    // ... or a new date format
    if (!isArray(lm)) {
        lm = line.match(/^HFDTEDATE:([0-9]{2})([0-9]{2})([0-9]{2}),.*$/);
    }

    if (lm) {
        return DateTime.fromObject({
            day: parseInt(lm[1], 10),
            month: parseInt(lm[2], 10),
            year: parseInt(`20${lm[3]}`, 10),
        });
    } else
        throw new Error(`igc::parseDate() - unrecognized record: ${line}`);

};




/**
 * Coordinate: degrees, minutes, seconds, orientation.
 */
export interface Coord {
    d: number;
    m: number;
    s: number;
    o: string;
}




/**
 * Point on track.
 */
export interface Position {
    time: DateTime;
    lat: Coord;
    lon: Coord;
    fix: string;
    palt: number;
    alt: number;
}




/**
 * Parse IGC "B" record.
 *
 * B HH MM SS DDMMmmm [NS] DDDMMmmm [EW] [AV] PPPPP GGGGG
 */
export const parsePoint = (line: string): Position => {

    const
        dd = "([0-9]{2})",
        ddd = "([0-9]{3})",
        lm = line.match(new RegExp([
            "^B",                       // type
            `${dd}${dd}${dd}`,          // time
            `${dd}${dd}${ddd}([NS])`,   // lat
            `${ddd}${dd}${ddd}([EW])`,  // lon
            "([AV])",                   // fix
            "([0-9]{5}|-[0-9]{4})",     // pressure alt
            "([0-9]{5}|-[0-9]{4})",     // alt
        ].join(empty())));

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
        };
    } else
        throw new Error(`igc::parsePoint() - unrecognized record: ${line}`);

};




/**
 * IGC flight stats.
 */
export interface FlightStats {
    duration: number;
}




/**
 * IGC file structure.
 */
export interface Track {
    name: string;
    date: DateTime;
    points: Position[];
    stats: FlightStats;
}




/**
 * Calculate flight duration.
 */
export const calculateDuration = (points: Position[]): number =>
    (last(points) as Position).time
        .diff((head(points) as Position).time, "seconds")
        .seconds;




/**
 * Parse IGC file.
 */
export const parseFile = async (name: string): Promise<Track> => {

    const
        lines = (await fsp.readFile(name, "utf8")).split("\r\n"),
        points = [];

    let date = null;

    for (const line of lines) {

        switch (classify(line)) {

            case IGCRecordType.Date:
                date = parseDate(line);
                break;

            case IGCRecordType.Position:
                points.push(parsePoint(line));
                break;

        }

    }

    if (date) {
        return {
            name, date, points,
            stats: {
                duration: calculateDuration(points),
            },
        };
    } else
        throw new Error(`igc::parseFile() - no 'date' record found: ${name}`);

};
