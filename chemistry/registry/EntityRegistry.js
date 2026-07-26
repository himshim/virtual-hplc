import { Validator } from './Validator.js';

/**
 * EntityRegistry.js - Central Unified Entity Registry for Analytical Chemistry Platform
 * Single source of truth with Cache, Lookup, Validation & Auto-Registration.
 */
export class EntityRegistry {
  constructor() {
    this.entities = new Map(); // id -> entity
  }

  register(entity) {
    Validator.validate(entity);
    if (this.entities.has(entity.id)) {
      console.warn(`[EntityRegistry] Overwriting registered entity "${entity.id}"`);
    }
    this.entities.set(entity.id, entity);
    return entity;
  }

  get(id) {
    return this.entities.get(id) || null;
  }

  getByType(type) {
    const results = [];
    for (const entity of this.entities.values()) {
      if (entity.type === type) results.push(entity);
    }
    return results;
  }

  getCompound(id) {
    const e = this.get(id);
    return e && e.type === "COMPOUND" ? e : null;
  }

  getMixture(id) {
    const e = this.get(id);
    return e && e.type === "MIXTURE" ? e : null;
  }

  getAllCompounds() {
    return this.getByType("COMPOUND");
  }

  getAllMixtures() {
    return this.getByType("MIXTURE");
  }

  clear() {
    this.entities.clear();
  }
}

export const globalEntityRegistry = new EntityRegistry();
