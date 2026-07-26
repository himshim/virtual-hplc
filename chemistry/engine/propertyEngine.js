/**
 * propertyEngine.js - Derived Chemistry Property Engine
 * Computes derived physical, chromatographic & spectroscopic properties from raw Compound entities.
 */

export function deriveHydrophobicityCategory(logP) {
  if (logP < 0) return "Hydrophilic (Low C18 Retention)";
  if (logP < 2.0) return "Moderately Hydrophobic";
  return "Highly Hydrophobic (Strong C18 Retention)";
}

export function estimateIsocraticRetention(compound, organicPercent) {
  const kw = compound.chromatography.kw;
  const S = compound.chromatography.S;
  const phi = organicPercent / 100;
  const log_k = Math.log10(kw) - (S * phi);
  return Math.pow(10, log_k);
}
