import { Compound } from '../entities/Compound.js';

export const IBUPROFEN = new Compound({
  id: "ibuprofen",
  name: "Ibuprofen",
  formula: "C13H18O2",
  mw: 206.28,
  properties: { logP: 3.50, solubility: "Low" },
  chromatography: { kw: 900, S: 5.1, pKa: 4.4, ionType: "acid" },
  uv: {
    lambdaMax: [220, 264],
    spectralPeaks: [
      { lambda: 220, width: 18, height: 0.80 },
      { lambda: 264, width: 16, height: 0.20 }
    ]
  },
  compatibility: { acidSensitive: false, baseSensitive: false, oxidizerSensitive: false }
});
