import { Compound } from '../entities/Compound.js';

export const THEOPHYLLINE = new Compound({
  id: 'theophylline',
  name: 'Theophylline',
  formula: 'C7H8N4O2',
  mw: 180.16,
  properties: { logP: -0.02, solubility: 'Moderate' },
  chromatography: { kw: 6.0, S: 2.2, pKa: 8.8, ionType: 'acid' },
  uv: {
    lambdaMax: [205, 272],
    spectralPeaks: [
      { lambda: 272, width: 20, height: 1.00 },
      { lambda: 205, width: 15, height: 0.75 }
    ]
  },
  compatibility: { acidSensitive: false, baseSensitive: false, oxidizerSensitive: false }
});
