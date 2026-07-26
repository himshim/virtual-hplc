import { Entity } from './Entity.js';

/**
 * Compound.js - Compound Entity Model
 * Encapsulates Identity, Physical, Chromatography, UV Spectra, and Compatibility data.
 */
export class Compound extends Entity {
  constructor({
    id,
    name,
    formula = "",
    mw = 0,
    properties = {},
    chromatography = {},
    uv = {},
    compatibility = {},
    schemaVersion = 1,
    entityVersion = "1.0.0",
    metadata = {}
  }) {
    super({ id, name, type: "COMPOUND", schemaVersion, entityVersion, metadata });

    this.formula = formula;
    this.mw = mw;
    this.properties = { logP: 0, solubility: "Moderate", ...properties };
    this.chromatography = { kw: 10, S: 3.0, pKa: 14.0, ionType: "neutral", ...chromatography };
    this.uv = {
      lambdaMax: [254],
      spectralPeaks: [{ lambda: 254, width: 20, height: 1.0 }],
      ...uv
    };
    this.compatibility = { acidSensitive: false, baseSensitive: false, oxidizerSensitive: false, ...compatibility };
  }

  validate() {
    super.validate();
    if (!this.chromatography.kw || this.chromatography.kw <= 0) {
      throw new Error(`[Compound Validation] Invalid kw for compound "${this.id}"`);
    }
    if (!this.uv.spectralPeaks || !Array.isArray(this.uv.spectralPeaks)) {
      throw new Error(`[Compound Validation] Invalid UV spectralPeaks for compound "${this.id}"`);
    }
    return true;
  }

  /**
   * Calculates extinction coefficient epsilon (0.0 to 1.0) at wavelength lambda.
   */
  getExtinctionCoefficient(lambdaNm) {
    if (!this.uv.spectralPeaks || this.uv.spectralPeaks.length === 0) return 0.5;

    let totalEpsilon = 0;
    for (const peak of this.uv.spectralPeaks) {
      const diff = lambdaNm - peak.lambda;
      const sigma = peak.width / 2.355;
      const val = peak.height * Math.exp(-(diff * diff) / (2 * sigma * sigma));
      totalEpsilon += val;
    }
    return Math.min(1.5, Math.max(0, totalEpsilon));
  }
}
