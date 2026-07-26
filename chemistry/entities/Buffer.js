import { Entity } from './Entity.js';

/**
 * Buffer.js - Buffer System Entity Model
 * Encapsulates Buffer system metadata, pKa values, effective buffering range, UV cutoff, and LC-MS compatibility.
 */
export class BufferEntity extends Entity {
  constructor({
    id,
    name,
    acidComponent = "",
    baseComponent = "",
    pKa = [],
    effectiveRange = { min: 2.0, max: 8.0 },
    recommendedRange = { min: 2.0, max: 8.0 },
    uvCutoffNm = 205,
    maxConcentrationMm = 50,
    lcmsCompatible = true,
    notes = "",
    schemaVersion = 1,
    entityVersion = "1.0.0",
    metadata = {}
  }) {
    super({ id, name, type: "BUFFER", schemaVersion, entityVersion, metadata });

    this.acidComponent = acidComponent;
    this.baseComponent = baseComponent;
    this.pKa = Array.isArray(pKa) ? [...pKa] : [pKa];
    this.effectiveRange = { ...effectiveRange };
    this.recommendedRange = { ...recommendedRange };
    this.uvCutoffNm = uvCutoffNm;
    this.maxConcentrationMm = maxConcentrationMm;
    this.lcmsCompatible = lcmsCompatible;
    this.notes = notes;
  }

  validate() {
    super.validate();
    if (!this.pKa || this.pKa.length === 0) {
      throw new Error(`[Buffer Validation] Buffer "${this.id}" must contain at least one pKa value.`);
    }
    return true;
  }
}
