import { Entity } from './Entity.js';

export class Reaction extends Entity {
  constructor({
    id,
    name,
    reactants = [],
    products = [],
    rateConstant = 0.01,
    schemaVersion = 1,
    entityVersion = "1.0.0",
    metadata = {}
  }) {
    super({ id, name, type: "REACTION", schemaVersion, entityVersion, metadata });

    this.reactants = [...reactants];
    this.products = [...products];
    this.rateConstant = rateConstant;
  }
}
