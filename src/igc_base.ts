/**
 * Aeria.
 *
 * IGC base types and regular expressions.
 *
 * @module aeria-app
 * @license Apache-2.0
 */




import { empty } from "@xcmats/js-toolbox/string";




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

    if (line.startsWith("HFDTE")) return IGCRecordType.Date;
    if (line.startsWith("B")) return IGCRecordType.Position;
    return IGCRecordType.Other;

};




/**
 * Base IGC record "shape".
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
