import { SATURATION_AU } from './constants.js';

/**
 * Generates dynamic detector baseline noise & thermal drift.
 * @param {number} time - Elapsed time in minutes
 * @param {number} sensitivity - Detector sensitivity multiplier
 * @returns {number} Signal noise intensity
 */
export function getBaselineNoise(time, sensitivity) {
  const staticNoise = (Math.random() - 0.5) * 0.02;
  const drift = Math.sin(time * 0.5) * 0.01;
  return (staticNoise + drift) * sensitivity;
}

/**
 * Checks if signal exceeds detector saturation limit.
 * @param {number} signal - Measured signal in AU
 * @returns {boolean} True if detector is saturated
 */
export function isDetectorSaturated(signal) {
  return signal >= SATURATION_AU;
}
