/**
 * opticalInstrumentModel.js — UV-Vis Optical Post-Processing Engine
 *
 * Implements a deterministic, UI-decoupled optical transformation pipeline:
 *
 *   Ideal Chemical Spectrum
 *            │
 *            ▼
 *   Wavelength Offset (Δλ)
 *            │
 *            ▼
 *   Slit Width Convolution (SBW Broadening & Peak Attenuation)
 *            │
 *            ▼
 *   Stray Light Transmission Deviation
 *            │
 *            ▼
 *   Observed Spectrum
 */

export const STRAY_LIGHT_PRESETS = {
  ideal: 0.0001,   // 0.01% stray light (research grade)
  routine: 0.0005, // 0.05% stray light (routine QC spectrophotometer)
  high: 0.0120,    // 1.20% stray light (aged / high stray light instrument)
};

export class OpticalInstrumentModel {
  /**
   * Post-process ideal chemical spectrum points through optical instrument pipeline.
   * @param {Array<{x: number, y: number}>} idealPoints - array of {x: lambda, y: idealAbsorbance}
   * @param {Object} opticsConfig - { slitWidth: number, wavelengthOffset: number, strayLightPreset: string }
   * @returns {Array<{x: number, y: number}>} observed points
   */
  static processSpectrum(idealPoints = [], opticsConfig = {}) {
    const sbw         = opticsConfig.slitWidth || 1.0;
    const deltaLambda = opticsConfig.wavelengthOffset || 0.0;
    const presetKey   = opticsConfig.strayLightPreset || 'routine';
    const strayLight  = STRAY_LIGHT_PRESETS[presetKey] ?? STRAY_LIGHT_PRESETS.routine;

    if (idealPoints.length === 0) return [];

    // 1. Shift Wavelength Axis (λ_obs = λ_true + Δλ)
    const shiftedPoints = idealPoints.map(pt => ({
      x: pt.x,
      y: pt.y,
      trueLambda: pt.x - deltaLambda
    }));

    // 2. Slit Width Convolution (SBW broadening & peak attenuation)
    // Default SBW = 1.0 nm is reference (kernel weight = 1.0)
    const smoothedPoints = [];
    const kernelRadius = Math.min(4, Math.floor(sbw / 1.0));

    for (let i = 0; i < shiftedPoints.length; i++) {
      if (kernelRadius <= 1) {
        smoothedPoints.push(shiftedPoints[i].y);
      } else {
        let sumWeights = 0;
        let sumVal = 0;
        for (let k = -kernelRadius; k <= kernelRadius; k++) {
          const idx = Math.max(0, Math.min(shiftedPoints.length - 1, i + k));
          const weight = Math.exp(-(k * k) / (2 * (kernelRadius / 2) * (kernelRadius / 2)));
          sumVal += shiftedPoints[idx].y * weight;
          sumWeights += weight;
        }
        smoothedPoints.push(sumVal / sumWeights);
      }
    }

    // 3. Apply Stray Light Transmission Deviation: A_obs = -log10(10^-A_ideal + I_stray)
    return idealPoints.map((pt, i) => {
      const idealA = Math.max(0, smoothedPoints[i]);
      const T_sample = Math.pow(10, -idealA);
      const T_obs = T_sample + strayLight;
      const obsAbs = Math.max(0, -Math.log10(T_obs));
      return {
        x: pt.x,
        y: Math.round(obsAbs * 10000) / 10000
      };
    });
  }

  /**
   * Single point optical transformation helper.
   */
  static processSingleAbsorbance(idealAbs, strayLightPreset = 'routine') {
    const strayLight = STRAY_LIGHT_PRESETS[strayLightPreset] ?? STRAY_LIGHT_PRESETS.routine;
    const T_sample = Math.pow(10, -Math.max(0, idealAbs));
    const T_obs = T_sample + strayLight;
    return Math.max(0, -Math.log10(T_obs));
  }
}
