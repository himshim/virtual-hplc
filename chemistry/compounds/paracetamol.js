import { Compound } from '../entities/Compound.js';

export const PARACETAMOL = new Compound({
  id: "paracetamol",
  name: "Paracetamol",
  formula: "C8H9NO2",
  mw: 151.16,
  properties: { logP: 0.46, solubility: "High" },
  chromatography: { kw: 20, S: 2.8, pKa: 9.5, ionType: "acid" },
  uv: {
    lambdaMax: [205, 243],
    spectralPeaks: [
      { lambda: 243, width: 25, height: 1.00 },
      { lambda: 205, width: 15, height: 0.70 }
    ]
  },
  compatibility: { acidSensitive: false, baseSensitive: false, oxidizerSensitive: true }
});
