/**
 * Aeria.
 *
 * Flight statistics routines.
 *
 * @module aeria-app
 * @license Apache-2.0
 */




import {
    head,
    last,
} from "@xcmats/js-toolbox/array";
import {
    IGCPosition,
    Track,
} from "./igc";




/**
 * IGC flight stats.
 */
export interface FlightStats {
    duration: number;
    maxAltGain: number;
}




/**
 * Calculate flight duration.
 */
export const calculateDuration = (points: IGCPosition[]): number =>
    (last(points) as IGCPosition).val.time
        .diff((head(points) as IGCPosition).val.time, "seconds")
        .seconds;




/**
 * Calculate maximum altitude gain.
 */
export const calculateMaxAltGain = (points: IGCPosition[]): number => {

    let min = 0, max = 0, gain = 0;

    points.forEach((point, i) => {
        if (i === 0) {
            min = point.val.alt;
            max = point.val.alt;
        } else {
            const prev = points[i-1].val.alt;
            if (prev <= point.val.alt) {
                // ascending
                if (point.val.alt > max) max = point.val.alt;
                const newGain = point.val.alt - min;
                if (newGain > gain) {
                    gain = newGain;
                }
            } else {
                // descending
                if (point.val.alt < min) min = point.val.alt;
            }
        }
    });

    return gain;

};




/**
 * Calculate flight statistics.
 */
export const calculateAllStats = (t: Track): FlightStats => ({
    duration: calculateDuration(t.points),
    maxAltGain: calculateMaxAltGain(t.points),
});
