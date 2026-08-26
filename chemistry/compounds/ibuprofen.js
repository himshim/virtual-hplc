import { Compound } from '../entities/Compound.js';

export const IBUPROFEN = new Compound({
  id: "ibuprofen",
  name: "Ibuprofen",
  formula: "C13H18O2",
  mw: 206.28,
  properties: { logP: 3.50, solubility: "Low" },
  chromatography: { kw: 16.0, S: 2.6, pKa: 4.4, ionType: "acid" },
  uv: {
    lambdaMax: [222, 264, 272],
    spectralPeaks: [
      { lambda: 264, width: 16, height: 1.00 },
      { lambda: 272, width: 14, height: 0.82 },
      { lambda: 222, width: 18, height: 0.45 }
    ]
  },
  compatibility: { acidSensitive: false, baseSensitive: false, oxidizerSensitive: false }
});
