import { Compound } from '../entities/Compound.js';

export const QUININE = new Compound({
  id: 'quinine',
  name: 'Quinine',
  formula: 'C20H24N2O2',
  mw: 324.42,
  properties: { logP: 3.44, solubility: 'Low' },
  chromatography: { kw: 13.5, S: 2.5, pKa: 8.5, ionType: 'base' },
  uv: {
    lambdaMax: [250, 350],
    spectralPeaks: [
      { lambda: 250, width: 25, height: 1.00 },
      { lambda: 350, width: 35, height: 0.40 }
    ]
  },
  compatibility: { acidSensitive: false, baseSensitive: false, oxidizerSensitive: false }
});
