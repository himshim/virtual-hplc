export const COLUMN_LENGTH_MM = 150;

/**
 * Calculates Peak Broadening (Sigma) using physical Van Deemter + Extra-Column Volume Dispersion.
 * @param {number} tR - Retention time in minutes
 * @param {number} flowRate - mL/min
 * @param {number} [tempCelsius=25] - Column temperature in °C
 * @param {number} [columnLengthMm=150] - Column length in mm
 * @returns {number} Standard deviation sigma in minutes
 */
export function getPeakSigma(tR, flowRate = 1.0, tempCelsius = 25, columnLengthMm = 150) {
  const safeFlow = Math.max(0.05, flowRate);
  const u = (safeFlow / 60) / (0.65 * Math.PI * 0.23 * 0.23); // cm/s
  const T_ratio = (tempCelsius + 273.15) / 298.15;
  const H = 0.0075 + (0.0002 * Math.pow(T_ratio, 1.75)) / u + (0.0005 / T_ratio) * u; // mm
  const N = Math.max(10, columnLengthMm / H);
  const sigmaCol2 = (tR * tR) / N;
  const sigmaExtra2 = 0.00015 / (safeFlow * safeFlow);
  return Math.sqrt(sigmaCol2 + sigmaExtra2);
}

/**
 * Calculates Gaussian peak height intensity at time t.
 */
export function getGaussianHeight(t, tR, sigma, height) {
  if (sigma <= 0) return 0;
  const diff = t - tR;
  return height * Math.exp(-(diff * diff) / (2 * sigma * sigma));
}
