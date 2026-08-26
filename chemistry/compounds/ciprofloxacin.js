import { Compound } from '../entities/Compound.js';

export const CIPROFLOXACIN = new Compound({
  id: 'ciprofloxacin',
  name: 'Ciprofloxacin',
  formula: 'C17H18FN3O3',
  mw: 331.34,
  properties: { logP: 0.28, solubility: 'Moderate' },
  chromatography: { kw: 11.0, S: 2.45, pKa: 6.1, ionType: 'zwitterion' },
  uv: {
    lambdaMax: [277, 315],
    spectralPeaks: [
      { lambda: 277, width: 22, height: 1.00 },
      { lambda: 315, width: 26, height: 0.65 }
    ]
  },
  compatibility: { acidSensitive: false, baseSensitive: false, oxidizerSensitive: false }
});
