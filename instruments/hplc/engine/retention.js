import { SolutionChemistryEngine } from '../../../chemistry/engine/solutionChemistryEngine.js';

/**
 * Calculates mobile phase dead time t0 (minutes) given column void volume & flow rate.
 */
export function getDeadTime(flowRate, voidVolumeMl = 1.5) {
  return voidVolumeMl / flowRate;
}

/**
 * Calculates temperature-adjusted mobile phase organic fraction effect on retention factor k.
 */
export function getRetentionFactor(kw, S, organicPercent, temperature = 25) {
  const phi = organicPercent / 100;
  const tempRatio = (25 + 273.15) / (temperature + 273.15);
  const adjustedKw = kw * Math.exp(450 * (1 / (temperature + 273.15) - 1 / 298.15));
  const log_k = Math.log10(adjustedKw) - (S * phi * tempRatio);
  return Math.pow(10, log_k);
}

/**
 * Calculates effective observed retention factor k_obs incorporating pH & ionization species distribution.
 */
export function getObservedRetentionFactor(compound, organicPercent, temperature = 25, pH = 7.0, bufferEntity = null) {
  if (!compound || !compound.chromatography) return 1.0;
  const kNeutral = getRetentionFactor(compound.chromatography.kw, compound.chromatography.S, organicPercent, temperature);
  const solution = SolutionChemistryEngine.evaluateSolution(compound, kNeutral, pH, bufferEntity);
  return solution.kObserved;
}

/**
 * Calculates solute retention time tR (minutes) given t0 and retention factor k.
 */
export function getRetentionTime(t0, k) {
  return t0 * (1 + k);
}
