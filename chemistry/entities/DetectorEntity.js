import { Entity } from './Entity.js';

/**
 * DetectorEntity.js - Abstract Detector Plugin Interface
 * All detector plugins implement detect(compound, params).
 */
export class DetectorEntity extends Entity {
  constructor({
    id,
    name,
    detectorType = "UV", // UV, PDA, FLD, RID, MS
    schemaVersion = 1,
    entityVersion = "1.0.0",
    metadata = {}
  }) {
    super({ id, name, type: "DETECTOR", schemaVersion, entityVersion, metadata });
    this.detectorType = detectorType;
  }

  /**
   * Abstract detect method implemented by specific detector plugins.
   * @param {Object} compound - Compound Entity
   * @param {Object} params - Detection parameters (e.g. wavelength, sensitivity)
   * @returns {number} Response signal
   */
  detect(compound, params) {
    throw new Error("detect() must be implemented by concrete Detector subclass.");
  }
}
