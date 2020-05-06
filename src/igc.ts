/**
 * Aeria.
 *
 * IGC parsing routines.
 *
 * @module aeria-app
 * @license Apache-2.0
 */




import { promises as fsp } from "fs";
import { empty } from "@xcmats/js-toolbox/string";
import { DateTime } from "luxon";




/**
 * IGC record regular expressions.
 */
export const IGCRegex = {

    // HFDTE [DATE:] dd mm yy
    HFDTE: /^HFDTE(DATE:)?([0-9]{2})([0-9]{2})([0-9]{2})(,.*)?$/,

    // B HH MM SS DDMMmmm [NS] DDDMMmmm [EW] [AV] PPPPP GGGGG
    B: ((): RegExp => {
        const dd = "([0-9]{2})", ddd = "([0-9]{3})";
        return new RegExp([
            "^B",                       // type
            `${dd}${dd}${dd}`,          // time
            `${dd}${dd}${ddd}([NS])`,   // lat
            `${ddd}${dd}${ddd}([EW])`,  // lon
            "([AV])",                   // fix
            "([0-9]{5}|-[0-9]{4})",     // pressure alt
            "([0-9]{5}|-[0-9]{4})",     // alt
        ].join(empty()));
    })(),

};




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
 * Base IGC record.
 */
export interface IGCRecord<T> {
    type: IGCRecordType;
    raw: string;
    val: T;
}




/**
 * Base class for all IGC records.
 */
export abstract class IGCBase<T> implements IGCRecord<T> {

    // IGCRecord fields
    abstract type: IGCRecordType;
    raw: string;

    // memoized value
    #memo: undefined | T;

    // default constructor
    constructor (raw: string) { this.raw = raw; }

    // mean to parse raw value
    abstract parse (): T;

    // parsed value getter
    get val (): T {
        if (!this.#memo) { this.#memo = this.parse(); }
        return this.#memo;
    }

}




/**
 * IGC date.
 */
export class IGCDate extends IGCBase<DateTime> {

    type = IGCRecordType.Date;

    parse (): DateTime { return IGCDate.parse(this.raw); }

    // Parse IGC DATE record into Luxon's DateTime object.
    static parse (line: string): DateTime {

        const lm = line.match(IGCRegex.HFDTE);

        if (lm) {
            return DateTime.fromObject({
                day: parseInt(lm[2], 10),
                month: parseInt(lm[3], 10),
                year: parseInt(`20${lm[4]}`, 10),
            });
        } else
            throw new Error(`IGCDate::parse() - unrecognized: ${line}`);

    }

}




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
 * IGC position.
 */
export class IGCPosition extends IGCBase<Position> {

    type = IGCRecordType.Position;

    parse (): Position { return IGCPosition.parse(this.raw); }

    // Parse IGC "B" record.
    static parse (line: string): Position {

        const lm = line.match(IGCRegex.B);

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
            throw new Error(`IGCPosition::parse() - unrecognized: ${line}`);

    }

}




/**
 * IGC file structure.
 */
export interface Track {
    name: string;
    date: IGCDate;
    points: IGCPosition[];
}




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
                date = new IGCDate(line);
                break;

            case IGCRecordType.Position:
                points.push(new IGCPosition(line));
                break;

        }

    }

    if (date) {
        return { name, date, points };
    } else
        throw new Error(`igc::parseFile() - no 'date' record found: ${name}`);

};
