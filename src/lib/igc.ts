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
    classify,
    IGCRecordType,
} from "./igc_base";
import { IGCDate } from "./igc_date";
import { IGCPosition } from "./igc_position";




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
