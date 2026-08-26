import { Compound } from '../entities/Compound.js';

export const DICLOFENAC_SODIUM = new Compound({
  id: 'diclofenac_sodium',
  name: 'Diclofenac Sodium',
  formula: 'C14H10Cl2NNaO2',
  mw: 318.13,
  properties: { logP: 4.51, solubility: 'Moderate' },
  chromatography: { kw: 14.5, S: 2.55, pKa: 4.0, ionType: 'acid' },
  uv: {
    lambdaMax: [276, 282],
    spectralPeaks: [
      { lambda: 276, width: 20, height: 1.00 },
      { lambda: 282, width: 22, height: 0.85 }
    ]
  },
  compatibility: { acidSensitive: false, baseSensitive: false, oxidizerSensitive: false }
});
