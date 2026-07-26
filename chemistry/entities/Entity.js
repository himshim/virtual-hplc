/**
 * Entity.js - Base Entity Interface for Analytical Chemistry Platform
 */
export class Entity {
  constructor({
    id,
    name,
    type,
    schemaVersion = 1,
    entityVersion = "1.0.0",
    metadata = {}
  }) {
    this.id = id;
    this.name = name;
    this.type = type; // COMPOUND, MIXTURE, COLUMN, MOBILE_PHASE, REACTION, DETECTOR, METHOD
    this.schemaVersion = schemaVersion;
    this.entityVersion = entityVersion;
    this.metadata = {
      createdAt: new Date().toISOString(),
      ...metadata
    };
  }

  validate() {
    if (!this.id || typeof this.id !== 'string') {
      throw new Error(`[Entity Validation] Missing or invalid id: ${this.id}`);
    }
    if (!this.name || typeof this.name !== 'string') {
      throw new Error(`[Entity Validation] Missing or invalid name for entity "${this.id}"`);
    }
    if (!this.type || typeof this.type !== 'string') {
      throw new Error(`[Entity Validation] Missing or invalid type for entity "${this.id}"`);
    }
    return true;
  }
}
