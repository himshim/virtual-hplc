import { TransportEngine } from './transportEngine.js';

export const COLUMN_LENGTH_MM = 150;

/**
 * Calculates Peak Broadening (Sigma) using Phase C TransportEngine (Van Deemter + Extra-Column Volume Dispersion).
 * @param {number} tR - Retention time in minutes
 * @param {number} flowRate - mL/min
 * @param {number} [tempCelsius=25] - Column temperature in °C
 * @param {number} [columnLengthMm=150] - Column length in mm
 * @returns {number} Standard deviation sigma in minutes
 */
export function getPeakSigma(tR, flowRate, tempCelsius = 25, columnLengthMm = 150) {
  const engine = new TransportEngine();
  const patch = engine.process({
    tR,
    flowRate,
    temperature: tempCelsius,
    columnLengthMm
  });
  return patch.sigmaTotal;
}

/**
 * Calculates Gaussian peak height intensity at time t.
 */
export function getGaussianHeight(t, tR, sigma, height) {
  if (sigma <= 0) return 0;
  const diff = t - tR;
  return height * Math.exp(-(diff * diff) / (2 * sigma * sigma));
}
