import { Compound } from '../entities/Compound.js';

export const CAFFEINE = new Compound({
  id: "caffeine",
  name: "Caffeine",
  formula: "C8H10N4O2",
  mw: 194.19,
  properties: { logP: -0.07, solubility: "Moderate" },
  chromatography: { kw: 12.5, S: 2.5, pKa: 14.0, ionType: "neutral" },
  uv: {
    lambdaMax: [205, 272],
    spectralPeaks: [
      { lambda: 272, width: 22, height: 1.00 },
      { lambda: 205, width: 15, height: 0.85 }
    ]
  },
  compatibility: { acidSensitive: false, baseSensitive: false, oxidizerSensitive: false }
});
