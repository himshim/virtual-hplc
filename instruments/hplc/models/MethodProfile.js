/**
 * MethodProfile.js - Method Development Exercise Profile Model
 */
export class MethodProfile {
  constructor({
    id,
    name,
    description,
    targetResolution = 1.5,
    targetPlates = 3500,
    targetCapacityMin = 1.0,
    targetCapacityMax = 10.0,
    maxPressureBar = 350,
    maxRunTimeMinutes = 8.0
  }) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.targetResolution = targetResolution;
    this.targetPlates = targetPlates;
    this.targetCapacityMin = targetCapacityMin;
    this.targetCapacityMax = targetCapacityMax;
    this.maxPressureBar = maxPressureBar;
    this.maxRunTimeMinutes = maxRunTimeMinutes;
  }
}
