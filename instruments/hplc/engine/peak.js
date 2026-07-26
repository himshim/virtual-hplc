import { getTemperatureVanDeemterParams } from './temperature.js';

export const COLUMN_LENGTH_MM = 150;

/**
 * Calculates Peak Broadening (Sigma) using physical Van Deemter model with temperature scaling.
 * @param {number} tR - Retention time in minutes
 * @param {number} flowRate - mL/min
 * @param {number} [tempCelsius=25] - Column temperature in °C
 * @returns {number} Standard deviation sigma in minutes
 */
export function getPeakSigma(tR, flowRate, tempCelsius = 25) {
  const H = getTemperatureVanDeemterParams(tempCelsius, flowRate);
  const N = COLUMN_LENGTH_MM / H;
  return tR / Math.sqrt(N);
}

/**
 * Calculates Gaussian peak height intensity at time t.
 */
export function getGaussianHeight(t, tR, sigma, height) {
  if (sigma <= 0) return 0;
  const diff = t - tR;
  return height * Math.exp(-(diff * diff) / (2 * sigma * sigma));
}
