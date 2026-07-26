/**
 * faultInjectionEngine.js - Phase G Fault Injection Engine & Consumable Aging Physics
 * 
 * Implements standard BaseEngine interface.
 * Models physical diagnostic faults (pump cavitation bubbles, leaking check valves,
 * clogged frits, lamp degradation, and column void aging).
 * 
 * Fault Types & Physical Consequences:
 * 1. PUMP_BUBBLE: Periodic pressure drop & baseline spike (S/N reduction, flow ripple).
 * 2. CHECK_VALVE_LEAK: Flow rate instability (effective F drops by 5-15%, retention shifts right).
 * 3. CLOGGED_FRIT: Backpressure surge (system pressure increases by 20-80%).
 * 4. LAMP_AGING: UV light intensity drops, white noise & baseline drift increase.
 * 5. COLUMN_AGING: Silanol degradation & voiding (plate count N drops 30-60%, tailing Tf increases).
 */

export const FAULT_DEFINITIONS = {
  PUMP_BUBBLE: {
    id: "PUMP_BUBBLE",
    name: "Air Bubble in Pump Head",
    category: "PUMP",
    description: "Causes periodic pressure drops and baseline spikes."
  },
  CHECK_VALVE_LEAK: {
    id: "CHECK_VALVE_LEAK",
    name: "Leaking Check Valve",
    category: "PUMP",
    description: "Intermittent flow delivery error and retention shift."
  },
  CLOGGED_FRIT: {
    id: "CLOGGED_FRIT",
    name: "Clogged Inlet Frit",
    category: "COLUMN",
    description: "Abnormal backpressure surge and peak splitting."
  },
  LAMP_AGING: {
    id: "LAMP_AGING",
    name: "Deuterium Lamp Degradation",
    category: "DETECTOR",
    description: "Lower UV intensity, increased optical baseline noise."
  },
  COLUMN_AGING: {
    id: "COLUMN_AGING",
    name: "Column Voiding / Stationary Phase Aging",
    category: "COLUMN",
    description: "Loss of efficiency (lower N) and severe peak tailing."
  }
};

export class FaultInjectionEngine {
  static metadata = {
    name: "FaultInjectionEngine",
    version: "1.0.0",
    apiVersion: 1,
    supports: ["faultInjection", "consumableAging", "pressureRipple", "baselineSpikes", "efficiencyLoss"]
  };

  validate(context) {
    return { valid: true, errors: [] };
  }

  /**
   * Processes active faults and consumable aging to calculate physical modifier patches.
   * @param {Object} context - Read-only SimulationContext
   * @returns {Object} Context patch with faultModifiers
   */
  process(context) {
    const activeFaults = context.activeFaults || [];
    const columnAgeInjections = Math.max(0, context.columnAgeInjections || 0); // Injection count (0 to 2000)
    const lampHours = Math.max(0, context.lampHours || 0); // Lamp hours (0 to 2000)

    // Base multipliers
    let flowMultiplier = 1.0;
    let pressureMultiplier = 1.0;
    let noiseMultiplier = 1.0;
    let tailingAdder = 0.0;
    let efficiencyMultiplier = 1.0;
    let baselineSpikeProbability = 0.0;

    // 1. Process Consumable Aging Physics
    if (columnAgeInjections > 500) {
      const ageFraction = Math.min(1.0, (columnAgeInjections - 500) / 1500);
      efficiencyMultiplier *= Math.max(0.4, 1.0 - 0.5 * ageFraction);
      tailingAdder += 0.8 * ageFraction;
    }

    if (lampHours > 1000) {
      const lampAgeFraction = Math.min(1.0, (lampHours - 1000) / 1000);
      noiseMultiplier *= (1.0 + 3.0 * lampAgeFraction);
    }

    // 2. Process Explicit Active Faults
    const activeFaultDetails = [];

    for (const fault of activeFaults) {
      const faultId = typeof fault === "string" ? fault : fault.id;
      const severity = typeof fault === "object" && fault.severity !== undefined ? fault.severity : 1.0; // 0.0 to 1.0

      switch (faultId) {
        case "PUMP_BUBBLE":
          flowMultiplier *= (1.0 - 0.15 * severity);
          pressureMultiplier *= (1.0 - 0.25 * severity);
          noiseMultiplier *= (1.0 + 2.5 * severity);
          baselineSpikeProbability = 0.05 * severity;
          activeFaultDetails.push({ id: faultId, effect: "Pressure drops & baseline spikes" });
          break;

        case "CHECK_VALVE_LEAK":
          flowMultiplier *= (1.0 - 0.10 * severity);
          pressureMultiplier *= (1.0 - 0.15 * severity);
          activeFaultDetails.push({ id: faultId, effect: "Intermittent flow drop & delayed tR" });
          break;

        case "CLOGGED_FRIT":
          pressureMultiplier *= (1.0 + 0.60 * severity);
          activeFaultDetails.push({ id: faultId, effect: "Backpressure surge (+60%)" });
          break;

        case "LAMP_AGING":
          noiseMultiplier *= (1.0 + 4.0 * severity);
          activeFaultDetails.push({ id: faultId, effect: "High baseline noise (S/N drop)" });
          break;

        case "COLUMN_AGING":
          efficiencyMultiplier *= (1.0 - 0.40 * severity);
          tailingAdder += 1.0 * severity;
          activeFaultDetails.push({ id: faultId, effect: "Efficiency loss & severe tailing" });
          break;
      }
    }

    return {
      faultModifiers: {
        flowMultiplier,
        pressureMultiplier,
        noiseMultiplier,
        tailingAdder,
        efficiencyMultiplier,
        baselineSpikeProbability,
        activeFaultDetails
      }
    };
  }

  report(context) {
    return {
      engine: FaultInjectionEngine.metadata.name,
      status: "ACTIVE"
    };
  }
}
