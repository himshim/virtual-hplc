import { BufferEntity } from '../entities/Buffer.js';

export const FORMATE_BUFFER = new BufferEntity({
  id: "formate_buffer",
  name: "Formate Buffer System",
  acidComponent: "Formic Acid",
  baseComponent: "Ammonium Formate",
  pKa: [3.75],
  effectiveRange: { min: 2.8, max: 4.8 },
  recommendedRange: { min: 3.0, max: 4.5 },
  uvCutoffNm: 210,
  maxConcentrationMm: 50,
  lcmsCompatible: true,
  notes: "Popular low pH LC-MS volatile buffer system."
});
