import { DetectorEntity } from '../entities/DetectorEntity.js';

/**
 * uvDetector.js - Plug-and-Play Variable Wavelength UV/Vis Detector Plugin
 * Calculates Beer-Lambert absorbance A(lambda) = epsilon(lambda) * concentration * sensitivity.
 * Models mobile phase UV cutoff baseline noise for lambda < 210 nm.
 */
export class UVDetectorPlugin extends DetectorEntity {
  constructor() {
    super({
      id: "uv_detector",
      name: "Variable Wavelength UV/Vis Detector",
      detectorType: "UV"
    });
  }

  detect(compound, { wavelengthNm = 254, sensitivity = 1.0, concentration = 1.0 }) {
    if (!compound || typeof compound.getExtinctionCoefficient !== 'function') {
      return 0;
    }

    const epsilon = compound.getExtinctionCoefficient(wavelengthNm);
    const absorbance = epsilon * concentration * sensitivity;
    return Math.max(0, absorbance);
  }

  getSolventNoiseMultiplier(wavelengthNm) {
    if (wavelengthNm >= 210) return 1.0;
    // Exponential baseline noise spike below 210 nm UV solvent cutoff
    const diff = 210 - wavelengthNm;
    return 1.0 + Math.pow(diff / 5, 1.8);
  }
}

export const UV_DETECTOR_PLUGIN = new UVDetectorPlugin();
