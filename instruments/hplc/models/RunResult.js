import { SIMULATION_VERSION, MODEL_VERSION } from '../engine/constants.js';

/**
 * RunResult.js - Exportable Post-Run Telemetry & Report Summary Model
 */
export class RunResult {
  constructor({
    sampleName,
    methodParams,
    peaks = [],
    elapsedTime = 0,
    maxPressure = 0,
    warnings = []
  }) {
    this.simulationVersion = SIMULATION_VERSION;
    this.modelVersion = MODEL_VERSION;
    this.timestamp = new Date().toISOString();
    this.sampleName = sampleName;
    this.methodParams = { ...methodParams }; // { flowRate, organicPercent, sensitivity }
    this.peaks = [...peaks]; // Array of Peak instances
    this.elapsedTime = elapsedTime;
    this.maxPressure = maxPressure;
    this.warnings = [...warnings];
  }
}
