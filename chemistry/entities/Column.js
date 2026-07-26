import { Entity } from './Entity.js';

export class Column extends Entity {
  constructor({
    id,
    name,
    lengthMm = 150,
    innerDiameterMm = 4.6,
    particleSizeUm = 5.0,
    phaseType = "C18",
    voidVolumeMl = 1.5,
    schemaVersion = 1,
    entityVersion = "1.0.0",
    metadata = {}
  }) {
    super({ id, name, type: "COLUMN", schemaVersion, entityVersion, metadata });

    this.lengthMm = lengthMm;
    this.innerDiameterMm = innerDiameterMm;
    this.particleSizeUm = particleSizeUm;
    this.phaseType = phaseType;
    this.voidVolumeMl = voidVolumeMl;
  }
}
