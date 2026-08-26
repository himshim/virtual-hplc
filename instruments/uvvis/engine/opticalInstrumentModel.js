/**
 * opticalInstrumentModel.js — UV-Vis Optical Post-Processing Engine
 *
 * Implements a deterministic, UI-decoupled optical transformation pipeline:
 *
 *   Ideal Chemical Spectrum
 *            │
 *            ▼
 *   Wavelength Offset (Δλ calibration shift)
 *            │
 *            ▼
 *   Slit Width Convolution (Triangular SBW Broadening & Peak Attenuation)
 *            │
 *            ▼
 *   Wavelength-Dependent Stray Light Transmission Deviation
 *            │
 *            ▼
 *   Observed Spectrum A_obs(λ)
 */

export const STRAY_LIGHT_PRESETS = {
  ideal: 0.0001,   // 0.01% stray light (research grade)
  routine: 0.0005, // 0.05% stray light (routine QC spectrophotometer)
  high: 0.0120,    // 1.20% stray light (aged / high stray light instrument)
};

export class OpticalInstrumentModel {
  /**
   * Computes wavelength-dependent stray light factor.
   * Stray light escalates significantly in the deep UV (< 230 nm) due to low deuterium lamp intensity
   * and higher optical grating scatter.
   * @param {number} lambda - wavelength in nm
   * @param {number} baseStray - baseline stray light fraction (e.g. 0.0005)
   * @returns {number} wavelength-dependent stray light fraction
   */
  static getWavelengthDependentStrayLight(lambda, baseStray = 0.0005) {
    if (lambda >= 260) return baseStray;
    const uvScatterBoost = Math.exp((230 - lambda) / 15.0);
    return baseStray * (1.0 + Math.min(5.0, uvScatterBoost));
  }

  /**
   * Post-process ideal chemical spectrum points through optical instrument pipeline.
   * @param {Array<{x: number, y: number}>} idealPoints - array of {x: lambda, y: idealAbsorbance}
   * @param {Object} opticsConfig - { slitWidth: number, wavelengthOffset: number, strayLightPreset: string }
   * @returns {Array<{x: number, y: number}>} observed points
   */
  static processSpectrum(idealPoints = [], opticsConfig = {}) {
    const sbw         = Number(opticsConfig.slitWidth) || 1.0;
    const deltaLambda = Number(opticsConfig.wavelengthOffset) || 0.0;
    const presetKey   = opticsConfig.strayLightPreset || 'routine';
    const baseStray   = STRAY_LIGHT_PRESETS[presetKey] ?? STRAY_LIGHT_PRESETS.routine;

    if (!idealPoints || idealPoints.length === 0) return [];

    // Helper for linear interpolation of ideal absorbance at any continuous wavelength
    const minX = idealPoints[0].x;
    const maxX = idealPoints[idealPoints.length - 1].x;
    const stepX = idealPoints.length > 1 ? (idealPoints[1].x - idealPoints[0].x) : 1;

    const sampleIdealA = (lambda) => {
      if (lambda <= minX) return idealPoints[0].y;
      if (lambda >= maxX) return idealPoints[idealPoints.length - 1].y;
      const idx = (lambda - minX) / stepX;
      const i0 = Math.floor(idx);
      const i1 = Math.min(idealPoints.length - 1, i0 + 1);
      const frac = idx - i0;
      return idealPoints[i0].y * (1 - frac) + idealPoints[i1].y * frac;
    };

    // 1. Shift Wavelength Axis + Slit Width Triangular Convolution
    // Monochromator slit function T_slit(dλ) = max(0, 1 - |dλ| / SBW)
    const result = [];
    const convRadius = Math.max(1, Math.ceil(sbw));
    const subSteps = 4; // sub-nanometer integration resolution

    for (let i = 0; i < idealPoints.length; i++) {
      const nominalLambda = idealPoints[i].x;
      const centerTrueLambda = nominalLambda - deltaLambda;

      let sumWeightedA = 0;
      let sumWeights = 0;

      for (let k = -convRadius * subSteps; k <= convRadius * subSteps; k++) {
        const dLambda = k / subSteps;
        const weight = Math.max(0, 1.0 - Math.abs(dLambda) / sbw);
        if (weight > 0) {
          const evalLambda = centerTrueLambda + dLambda;
          const aVal = sampleIdealA(evalLambda);
          sumWeightedA += aVal * weight;
          sumWeights += weight;
        }
      }

      const smoothedA = sumWeights > 0 ? (sumWeightedA / sumWeights) : sampleIdealA(centerTrueLambda);

      // 2. Apply Wavelength-Dependent Stray Light Transmission Deviation:
      // T_obs = 10^(-A) + I_stray(λ), A_obs = -log10(T_obs)
      const stray = OpticalInstrumentModel.getWavelengthDependentStrayLight(nominalLambda, baseStray);
      const T_sample = Math.pow(10, -Math.max(0, smoothedA));
      const T_obs = T_sample + stray;
      const obsAbs = Math.max(0, -Math.log10(T_obs));

      result.push({
        x: nominalLambda,
        y: Math.round(obsAbs * 10000) / 10000
      });
    }

    return result;
  }

  /**
   * Single point optical transformation helper.
   */
  static processSingleAbsorbance(idealAbs, lambda = 250, strayLightPreset = 'routine') {
    const baseStray = STRAY_LIGHT_PRESETS[strayLightPreset] ?? STRAY_LIGHT_PRESETS.routine;
    const stray = OpticalInstrumentModel.getWavelengthDependentStrayLight(lambda, baseStray);
    const T_sample = Math.pow(10, -Math.max(0, idealAbs));
    const T_obs = T_sample + stray;
    return Math.max(0, -Math.log10(T_obs));
  }
}
