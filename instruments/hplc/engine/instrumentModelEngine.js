/**
 * instrumentModelEngine.js - Phase F Physical Instrument Hardware Model Engine
 * 
 * Implements standard BaseEngine interface.
 * Models physical hardware parameters of different HPLC instruments (dwell volume Vd,
 * injection volume Vinj, capillary tubing Vtube, flow cell Vcell, pressure limit Pmax,
 * and detector response time tau_det).
 * 
 * Presets:
 * 1. Standard HPLC (Waters Alliance 2695): Vd = 1.10 mL, Vinj = 10 uL, Vcell = 10 uL, Pmax = 400 bar
 * 2. UHPLC (Agilent 1290 Infinity II): Vd = 0.35 mL, Vinj = 5 uL, Vcell = 3 uL, Pmax = 1200 bar
 * 3. Micro-LC (Shimadzu Prominence-i): Vd = 0.20 mL, Vinj = 2 uL, Vcell = 1 uL, Pmax = 800 bar
 * 
 * Equations:
 * 1. Dwell delay td = Vd / flowRate
 * 2. Extra-column variance sigma_extra^2 = (Vinj^2/12) + (Vtube^2/12) + (Vcell^2/12)
 * 3. Hagen-Poiseuille Pressure P = (180 * eta * L * u) / (dp^2)
 */

export const INSTRUMENT_PRESETS = {
  STANDARD_HPLC: {
    id: "STANDARD_HPLC",
    name: "Standard HPLC (Waters Alliance 2695)",
    dwellVolumeMl: 1.10,
    injectionVolumeUl: 10.0,
    tubingLengthCm: 30.0,
    tubingIdMm: 0.17, // 0.007 inch ID capillary
    flowCellVolumeUl: 10.0,
    maxPressureBar: 400,
    detectorResponseMs: 100,
    samplingRateHz: 10
  },
  UHPLC: {
    id: "UHPLC",
    name: "UHPLC System (Agilent 1290 Infinity II)",
    dwellVolumeMl: 0.35,
    injectionVolumeUl: 5.0,
    tubingLengthCm: 15.0,
    tubingIdMm: 0.12, // 0.005 inch ID capillary
    flowCellVolumeUl: 3.0,
    maxPressureBar: 1200,
    detectorResponseMs: 50,
    samplingRateHz: 40
  },
  MICRO_LC: {
    id: "MICRO_LC",
    name: "Micro-LC Platform (Shimadzu Prominence)",
    dwellVolumeMl: 0.20,
    injectionVolumeUl: 2.0,
    tubingLengthCm: 10.0,
    tubingIdMm: 0.08, // micro capillary
    flowCellVolumeUl: 1.0,
    maxPressureBar: 800,
    detectorResponseMs: 25,
    samplingRateHz: 80
  }
};

export class InstrumentModelEngine {
  static metadata = {
    name: "InstrumentModelEngine",
    version: "1.0.0",
    apiVersion: 1,
    supports: ["hardwarePresets", "dwellVolumeDelay", "extraColumnDispersion", "hagenPoiseuillePressure"]
  };

  validate(context) {
    const flowRate = context.flowRate || 1.0;
    if (flowRate <= 0) {
      return { valid: false, errors: ["Flow rate must be greater than zero."] };
    }
    return { valid: true, errors: [] };
  }

  /**
   * Processes hardware properties and derives transport/pressure parameters.
   * @param {Object} context - Read-only SimulationContext
   * @returns {Object} Context patch with hardware parameters
   */
  process(context) {
    const instrumentId = context.instrumentPresetId || "STANDARD_HPLC";
    const preset = INSTRUMENT_PRESETS[instrumentId] || INSTRUMENT_PRESETS.STANDARD_HPLC;

    const flowRate = Math.max(0.01, context.flowRate || 1.0); // mL/min
    const columnLengthMm = context.columnLengthMm || 150; // mm
    const particleSizeUm = context.particleSizeUm || 5.0; // um
    const innerDiameterMm = context.innerDiameterMm || 4.6; // mm
    const mobilePhaseViscositycP = context.viscositycP || 0.9; // cP (water/methanol ~0.9)

    // 1. Dwell volume gradient delay time td (min)
    const dwellDelayTd = preset.dwellVolumeMl / flowRate;

    // 2. Extra-column tubing volume Vtube (uL)
    const tubingRadiusMm = preset.tubingIdMm / 2;
    const tubingVolUl = Math.PI * (tubingRadiusMm * tubingRadiusMm) * (preset.tubingLengthCm * 10) * 1000;

    // 3. Total Extra-column variance sigma_extra^2 (min^2)
    const vInjMl = preset.injectionVolumeUl / 1000;
    const vTubeMl = tubingVolUl / 1000;
    const vCellMl = preset.flowCellVolumeUl / 1000;

    const sigmaInj2 = (vInjMl * vInjMl) / 12.0;
    const sigmaTube2 = (vTubeMl * vTubeMl) / 12.0;
    const sigmaCell2 = (vCellMl * vCellMl) / 12.0;

    const sigmaExtraVolMl = Math.sqrt(sigmaInj2 + sigmaTube2 + sigmaCell2);
    const sigmaExtraTimeMin = sigmaExtraVolMl / flowRate;

    // 4. Hagen-Poiseuille System Pressure Calculation P (bar)
    // P = (180 * eta * L * u) / (dp^2)
    const linearVelocityMmMin = (flowRate * 1000) / (Math.PI * Math.pow(innerDiameterMm / 2, 2) * 0.65); // u in mm/min
    const uCmSec = (linearVelocityMmMin / 10) / 60; // cm/sec
    const LCm = columnLengthMm / 10;
    const dpCm = particleSizeUm / 10000;

    // Pressure in bar (1 bar = 10^5 Pa)
    const rawPressureBar = (180 * (mobilePhaseViscositycP * 0.001) * LCm * uCmSec) / (dpCm * dpCm);
    const systemPressureBar = Math.round(Math.max(10, rawPressureBar));

    const isOverpressure = systemPressureBar > preset.maxPressureBar;

    return {
      instrumentPreset: preset,
      dwellDelayTd,
      dwellVolumeMl: preset.dwellVolumeMl,
      sigmaExtraVolMl,
      sigmaExtraTimeMin,
      systemPressureBar,
      maxPressureBar: preset.maxPressureBar,
      isOverpressure,
      samplingRateHz: preset.samplingRateHz,
      detectorResponseMs: preset.detectorResponseMs
    };
  }

  report(context) {
    return {
      engine: InstrumentModelEngine.metadata.name,
      status: "ACTIVE"
    };
  }
}
