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
    Position,
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
export const calculateDuration = (points: Position[]): number =>
    (last(points) as Position).time
        .diff((head(points) as Position).time, "seconds")
        .seconds;




/**
 * Calculate maximum altitude gain.
 */
export const calculateMaxAltGain = (points: Position[]): number => {

    let min = 0, max = 0, gain = 0;

    points.forEach((point, i) => {
        if (i === 0) {
            min = point.alt;
            max = point.alt;
        } else {
            const prev = points[i-1].alt;
            if (prev <= point.alt) {
                // ascending
                if (point.alt > max) max = point.alt;
                const newGain = point.alt - min;
                if (newGain > gain) {
                    gain = newGain;
                }
            } else {
                // descending
                if (point.alt < min) min = point.alt;
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
