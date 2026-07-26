/**
 * Validator.js - Entity Schema & Integrity Validator
 */
export class Validator {
  static validate(entity) {
    if (!entity) {
      throw new Error("[Validator] Cannot validate null or undefined entity.");
    }

    if (typeof entity.validate === 'function') {
      entity.validate();
    }

    if (entity.schemaVersion === undefined || entity.entityVersion === undefined) {
      throw new Error(`[Validator] Entity "${entity.id || 'unknown'}" is missing schema version metadata.`);
    }

    return true;
  }
}
