import { Compound } from '../entities/Compound.js';

export const METRONIDAZOLE = new Compound({
  id: 'metronidazole',
  name: 'Metronidazole',
  formula: 'C6H9N3O3',
  mw: 171.15,
  properties: { logP: -0.05, solubility: 'High' },
  chromatography: { kw: 4.5, S: 2.0, pKa: 2.6, ionType: 'base' },
  uv: {
    lambdaMax: [277, 320],
    spectralPeaks: [
      { lambda: 277, width: 24, height: 1.00 },
      { lambda: 320, width: 30, height: 0.80 }
    ]
  },
  compatibility: { acidSensitive: false, baseSensitive: false, oxidizerSensitive: false }
});
