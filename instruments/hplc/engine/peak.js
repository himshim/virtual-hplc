/**
 * Column & Van Deemter Band Broadening Engine
 * Column: 150 mm length x 4.6 mm ID, 5 µm particles
 */
export const COLUMN_LENGTH_MM = 150;

/**
 * Calculates Peak Broadening (Sigma) using physical Van Deemter model.
 * HETP H = A + B/u + C*u (in mm)
 * N = L / H
 * sigma = tR / sqrt(N)
 * 
 * @param {number} tR - Retention time in minutes
 * @param {number} flowRate - mL/min
 * @returns {number} Standard deviation sigma in minutes
 */
export function getPeakSigma(tR, flowRate) {
  const safeFlow = Math.max(flowRate, 0.01);
  
  // Van Deemter parameters for 5µm C18 stationary phase
  const A = 0.005;             // Eddy diffusion (mm)
  const B = 0.01 / safeFlow;   // Longitudinal diffusion (mm * mL/min)
  const C = 0.015 * safeFlow;  // Mass transfer resistance (mm / (mL/min))
  
  const H = A + B + C;          // Height Equivalent to Theoretical Plate in mm
  const N = COLUMN_LENGTH_MM / H; // Total theoretical plate count (e.g. 5000 plates)
  
  return tR / Math.sqrt(N);
}

/**
 * Calculates Gaussian peak height intensity at time t.
 * I(t) = height * exp( - (t - tR)^2 / (2 * sigma^2) )
 * @param {number} t - Current time in minutes
 * @param {number} tR - Peak retention time in minutes
 * @param {number} sigma - Peak standard deviation
 * @param {number} height - Nominal peak height
 * @returns {number} Instantaneous peak intensity
 */
export function getGaussianHeight(t, tR, sigma, height) {
  if (sigma <= 0) return 0;
  const diff = t - tR;
  return height * Math.exp(-(diff * diff) / (2 * sigma * sigma));
}
