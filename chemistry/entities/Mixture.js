import { Entity } from './Entity.js';

/**
 * Mixture.js - Multi-Component Sample Mixture Entity Model
 * Schema readiness for future Reaction Engine & Compatibility Rules.
 */
export class Mixture extends Entity {
  constructor({
    id,
    name,
    description = "",
    components = [], // Array of { compoundId, concentration, role }
    reactionRules = [], // Future Reaction Engine rules
    compatibilityRules = [], // Future Compatibility rules
    schemaVersion = 1,
    entityVersion = "1.0.0",
    metadata = {}
  }) {
    super({ id, name, type: "MIXTURE", schemaVersion, entityVersion, metadata });

    this.description = description;
    this.components = [...components];
    this.reactionRules = [...reactionRules];
    this.compatibilityRules = [...compatibilityRules];
  }

  validate() {
    super.validate();
    if (!Array.isArray(this.components) || this.components.length === 0) {
      throw new Error(`[Mixture Validation] Mixture "${this.id}" must contain at least one component.`);
    }
    return true;
  }
}
