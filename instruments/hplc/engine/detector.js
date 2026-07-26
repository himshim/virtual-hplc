import { SATURATION_AU } from './constants.js';
import { UV_DETECTOR_PLUGIN } from '../../../chemistry/detectors/uvDetector.js';

/**
 * Park-Miller LCG deterministic pseudo-random generator for baseline noise.
 */
function lcgRandom(seed) {
  const s = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return s - Math.floor(s);
}

/**
 * Generates dynamic detector baseline noise, pump stroke ripple, & thermal drift.
 * Incorporates wavelength UV cutoff noise multiplier.
 * 100% deterministic using time-based seed.
 *
 * @param {number} time - Elapsed time in minutes
 * @param {number} sensitivity - Detector sensitivity multiplier
 * @param {number} [wavelengthNm=254] - Detector wavelength in nm
 * @param {number} [baseSeed=42] - Seed for PRNG reproducibility
 * @returns {number} Signal noise intensity (AU)
 */
export function getBaselineNoise(time, sensitivity, wavelengthNm = 254, baseSeed = 42) {
  // Deterministic Gaussian white noise component (~0.00015 AU RMS)
  const prngVal = lcgRandom(baseSeed + Math.floor(time * 6000));
  const whiteNoise = (prngVal - 0.5) * 0.0003;

  // Thermal drift (slow 8-minute sinusoidal period, amplitude 0.0002 AU)
  const thermalDrift = Math.sin((2 * Math.PI * time) / 8.0) * 0.0002;

  // Pump stroke piston ripple (~1.2 Hz stroke frequency, amplitude 0.0001 AU)
  const pumpRipple = Math.sin((2 * Math.PI * time * 72.0)) * 0.0001;

  const noiseMult = UV_DETECTOR_PLUGIN.getSolventNoiseMultiplier(wavelengthNm);
  const totalNoise = (whiteNoise + thermalDrift + pumpRipple) * sensitivity * noiseMult;

  return totalNoise;
}

/**
 * Checks if signal exceeds detector saturation limit.
 */
export function isDetectorSaturated(signal) {
  return signal >= SATURATION_AU;
}
