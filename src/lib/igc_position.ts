/**
 * Aeria.
 *
 * IGC position parsing.
 *
 * @module aeria-app
 * @license Apache-2.0
 */




import { DateTime } from "luxon";
import {
    IGCBase,
    IGCRecordType,
    IGCRegex,
} from "./igc_base";




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
