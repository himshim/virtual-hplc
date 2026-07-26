import { COLUMN_VOID_VOLUME } from './constants.js';
import { getTemperatureRetentionFactor } from './temperature.js';

export function getDeadTime(flowRate) {
  const safeFlow = Math.max(flowRate, 0.01);
  return COLUMN_VOID_VOLUME / safeFlow;
}

/**
 * Calculates Retention Factor (k) using LSS model with temperature dependence.
 */
export function getRetentionFactor(kw, S, organicPercent, tempCelsius = 25) {
  const phi = organicPercent / 100;
  const log_k = Math.log10(kw) - (S * phi);
  const k25 = Math.pow(10, log_k);
  const tempFactor = getTemperatureRetentionFactor(tempCelsius);
  return k25 * tempFactor;
}

export function getRetentionTime(t0, k) {
  return t0 * (1 + k);
}
