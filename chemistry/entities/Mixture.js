import { Entity } from './Entity.js';

/**
 * Mixture.js - Multi-Component Sample Mixture Entity Model
 */
export class Mixture extends Entity {
  constructor({
    id,
    name,
    description = "",
    components = [], // Array of { compoundId, concentration, role }
    schemaVersion = 1,
    entityVersion = "1.0.0",
    metadata = {}
  }) {
    super({ id, name, type: "MIXTURE", schemaVersion, entityVersion, metadata });

    this.description = description;
    this.components = [...components];
  }

  validate() {
    super.validate();
    if (!Array.isArray(this.components) || this.components.length === 0) {
      throw new Error(`[Mixture Validation] Mixture "${this.id}" must contain at least one component.`);
    }
    return true;
  }
}
