import { BufferEntity } from '../entities/Buffer.js';

export const ACETATE_BUFFER = new BufferEntity({
  id: "acetate_buffer",
  name: "Acetate Buffer System",
  acidComponent: "Acetic Acid",
  baseComponent: "Sodium Acetate / Ammonium Acetate",
  pKa: [4.76],
  effectiveRange: { min: 3.8, max: 5.8 },
  recommendedRange: { min: 4.0, max: 5.5 },
  uvCutoffNm: 210,
  maxConcentrationMm: 50,
  lcmsCompatible: true, // Volatile ammonium acetate is LC-MS compatible
  notes: "Ideal for acidic compound separation (pH 3.8-5.8). Volatile Ammonium Acetate is LC-MS compatible."
});
