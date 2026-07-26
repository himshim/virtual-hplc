import { Entity } from './Entity.js';

export class MobilePhase extends Entity {
  constructor({
    id,
    name,
    solventA = "Water",
    solventB = "Methanol",
    uvCutoffNm = 205,
    schemaVersion = 1,
    entityVersion = "1.0.0",
    metadata = {}
  }) {
    super({ id, name, type: "MOBILE_PHASE", schemaVersion, entityVersion, metadata });

    this.solventA = solventA;
    this.solventB = solventB;
    this.uvCutoffNm = uvCutoffNm;
  }
}
