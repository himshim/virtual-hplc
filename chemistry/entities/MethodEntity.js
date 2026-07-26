import { Entity } from './Entity.js';

export class MethodEntity extends Entity {
  constructor({
    id,
    name,
    flowRate = 1.0,
    organicPercent = 40,
    temperature = 25,
    wavelengthNm = 254,
    schemaVersion = 1,
    entityVersion = "1.0.0",
    metadata = {}
  }) {
    super({ id, name, type: "METHOD", schemaVersion, entityVersion, metadata });

    this.flowRate = flowRate;
    this.organicPercent = organicPercent;
    this.temperature = temperature;
    this.wavelengthNm = wavelengthNm;
  }
}
