import { DEFAULT_SPEED } from '../engine/constants.js';

/**
 * SimulationState.js - Transient Real-time Instrument State Model
 */
export class SimulationState {
  constructor({
    status = 'IDLE',
    flowRate = 1.0,
    organicPercent = 40,
    sensitivity = 1.0,
    speedMultiplier = DEFAULT_SPEED,
    sampleKey = 'caffeine',
    time = 0,
    pressure = 0,
    detectorSignal = 0,
    warnings = []
  } = {}) {
    this.status = status;
    this.flowRate = flowRate;
    this.organicPercent = organicPercent;
    this.sensitivity = sensitivity;
    this.speedMultiplier = speedMultiplier;
    this.sampleKey = sampleKey;
    this.time = time;
    this.pressure = pressure;
    this.detectorSignal = detectorSignal;
    this.warnings = [...warnings];
  }

  resetTime() {
    this.time = 0;
    this.detectorSignal = 0;
  }

  addWarning(msg) {
    if (!this.warnings.includes(msg)) {
      this.warnings.push(msg);
    }
  }

  clearWarnings() {
    this.warnings = [];
  }
}
