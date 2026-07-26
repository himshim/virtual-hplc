import { Compound } from '../entities/Compound.js';

export const ASPIRIN = new Compound({
  id: "aspirin",
  name: "Aspirin",
  formula: "C9H8O4",
  mw: 180.16,
  properties: { logP: 1.19, solubility: "Moderate" },
  chromatography: { kw: 150, S: 4.2, pKa: 3.5, ionType: "acid" },
  uv: {
    lambdaMax: [226, 276],
    spectralPeaks: [
      { lambda: 226, width: 20, height: 0.90 },
      { lambda: 276, width: 22, height: 0.35 }
    ]
  },
  compatibility: { acidSensitive: true, baseSensitive: true, oxidizerSensitive: false }
});
