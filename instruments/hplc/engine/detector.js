import { SATURATION_AU } from './constants.js';
import { UV_DETECTOR_PLUGIN } from '../../../chemistry/detectors/uvDetector.js';

/**
 * Generates dynamic detector baseline noise & thermal drift incorporating wavelength UV cutoff noise.
 * @param {number} time - Elapsed time in minutes
 * @param {number} sensitivity - Detector sensitivity multiplier
 * @param {number} [wavelengthNm=254] - Detector wavelength in nm
 * @returns {number} Signal noise intensity
 */
export function getBaselineNoise(time, sensitivity, wavelengthNm = 254) {
  const staticNoise = (Math.random() - 0.5) * 0.02;
  const drift = Math.sin(time * 0.5) * 0.01;
  const noiseMult = UV_DETECTOR_PLUGIN.getSolventNoiseMultiplier(wavelengthNm);
  return (staticNoise + drift) * sensitivity * noiseMult;
}

/**
 * Checks if signal exceeds detector saturation limit.
 */
export function isDetectorSaturated(signal) {
  return signal >= SATURATION_AU;
}
