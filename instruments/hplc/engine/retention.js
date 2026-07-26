import { COLUMN_VOID_VOLUME } from './constants.js';

/**
 * Calculates Column Dead Time (t0) based on Flow Rate.
 * @param {number} flowRate - mL/min
 * @returns {number} t0 in minutes
 */
export function getDeadTime(flowRate) {
  const safeFlow = Math.max(flowRate, 0.01);
  return COLUMN_VOID_VOLUME / safeFlow;
}

/**
 * Calculates Retention Factor (k) using Linear Solvent Strength (LSS) model.
 * log10(k) = log10(kw) - S * phi
 * @param {number} kw - Retention factor in 100% water
 * @param {number} S - Solvent strength parameter
 * @param {number} organicPercent - Mobile phase %B (0 - 100)
 * @returns {number} Retention factor k
 */
export function getRetentionFactor(kw, S, organicPercent) {
  const phi = organicPercent / 100;
  const log_k = Math.log10(kw) - (S * phi);
  return Math.pow(10, log_k);
}

/**
 * Calculates theoretical Retention Time (tR) in minutes.
 * tR = t0 * (1 + k)
 * @param {number} t0 - Dead time in minutes
 * @param {number} k - Retention factor
 * @returns {number} tR in minutes
 */
export function getRetentionTime(t0, k) {
  return t0 * (1 + k);
}
