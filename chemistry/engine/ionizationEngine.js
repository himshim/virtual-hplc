import { calculateIonizationFractions } from './acidBaseEngine.js';

/**
 * ionizationEngine.js - Ionization & Observed Retention Calculator
 * Computes species distribution and observed retention factor k_obs.
 */

/**
 * Calculates effective observed retention factor k_obs for a compound entity at specified mobile phase pH.
 * @param {Object} compound - Compound Entity
 * @param {number} kNeutral - Un-ionized baseline retention factor k
 * @param {number} pH - Solution pH
 * @param {number} [ionicAffinity=0.10] - Configurable ionic affinity multiplier on C18
 */
export function calculateObservedRetentionFactor(compound, kNeutral, pH, ionicAffinity = 0.10) {
  if (!compound || !compound.chromatography) {
    return { kObserved: kNeutral, alphaNeutral: 1.0, alphaIonized: 0.0, explanation: "" };
  }

  const ionType = compound.chromatography.ionType || "neutral";
  const pKa = compound.chromatography.pKa;

  const { alphaNeutral, alphaIonized } = calculateIonizationFractions(ionType, pKa, pH);

  // Ionized species have ionicAffinity (e.g. 0.10x) retention relative to neutral species on C18
  const kIonized = kNeutral * ionicAffinity;
  const kObserved = (alphaNeutral * kNeutral) + (alphaIonized * kIonized);

  let explanation = "";
  if (alphaIonized > 0.5) {
    explanation = `At pH ${pH.toFixed(1)}, ${compound.name} is predominantly ionized (${(alphaIonized * 100).toFixed(0)}%), causing a significant drop in C18 retention.`;
  } else if (alphaIonized > 0.05) {
    explanation = `At pH ${pH.toFixed(1)}, ${compound.name} is partially ionized (${(alphaIonized * 100).toFixed(0)}%), causing a moderate shift in retention.`;
  } else {
    explanation = `At pH ${pH.toFixed(1)}, ${compound.name} is predominantly un-ionized neutral (${(alphaNeutral * 100).toFixed(0)}%), maximizing C18 retention.`;
  }

  return {
    kObserved,
    alphaNeutral,
    alphaIonized,
    explanation
  };
}
