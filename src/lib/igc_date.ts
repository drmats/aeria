/**
 * Aeria.
 *
 * IGC date parsing.
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
