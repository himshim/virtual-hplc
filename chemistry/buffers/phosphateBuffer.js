import { BufferEntity } from '../entities/Buffer.js';

export const PHOSPHATE_BUFFER = new BufferEntity({
  id: "phosphate_buffer",
  name: "Phosphate Buffer System",
  acidComponent: "Phosphoric Acid / Dihydrogen Phosphate",
  baseComponent: "Hydrogen Phosphate / Phosphate",
  pKa: [2.15, 6.82, 12.38],
  effectiveRange: { min: 2.0, max: 8.0 },
  recommendedRange: { min: 2.1, max: 7.5 },
  uvCutoffNm: 200,
  maxConcentrationMm: 50,
  lcmsCompatible: false, // Non-volatile, not suitable for LC-MS
  notes: "Excellent UV transparency down to 200 nm. Non-volatile (avoid for LC-MS)."
});
