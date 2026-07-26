/**
 * samples.js - Rich Sample Compound Database & Mixture Definitions
 * Solute parameters based on Linear Solvent Strength (LSS) retention model:
 * - kw: Retention factor in 100% water
 * - S: Solvent strength sensitivity parameter
 * - height: Relative peak absorption height multiplier
 */

export const SAMPLES = {
  paracetamol: {
    id: "paracetamol",
    name: "Paracetamol",
    peaks: [
      { compound: "Paracetamol", kw: 20, S: 2.8, height: 1.0 }
    ]
  },
  caffeine: {
    id: "caffeine",
    name: "Caffeine",
    peaks: [
      { compound: "Caffeine", kw: 65, S: 3.5, height: 1.0 }
    ]
  },
  aspirin: {
    id: "aspirin",
    name: "Aspirin",
    peaks: [
      { compound: "Aspirin", kw: 150, S: 4.2, height: 0.9 }
    ]
  },
  ibuprofen: {
    id: "ibuprofen",
    name: "Ibuprofen",
    peaks: [
      { compound: "Ibuprofen", kw: 900, S: 5.1, height: 0.8 }
    ]
  },
  mixture: {
    id: "mixture",
    name: "Mixture (all four)",
    peaks: [
      { compound: "Paracetamol", kw: 20, S: 2.8, height: 0.8 },
      { compound: "Caffeine", kw: 65, S: 3.5, height: 0.9 },
      { compound: "Aspirin", kw: 150, S: 4.2, height: 0.85 },
      { compound: "Ibuprofen", kw: 900, S: 5.1, height: 0.75 }
    ]
  }
};

export function getSample(key) {
  return SAMPLES[key] || SAMPLES.caffeine;
}
