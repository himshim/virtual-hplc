import { validateBufferSystem, getBufferNoiseMultiplier } from './bufferEngine.js';
import { calculateObservedRetentionFactor } from './ionizationEngine.js';

/**
 * solutionChemistryEngine.js - Solution Chemistry Orchestrator Facade
 * Exposes a single unified solution chemistry API to instruments.
 */
export class SolutionChemistryEngine {
  /**
   * Evaluates solution chemistry for a compound at specified mobile phase conditions.
   * @param {Object} compound - Compound Entity
   * @param {number} kNeutral - Baseline un-ionized retention factor k
   * @param {number} pH - Solution pH (2.0 - 8.0)
   * @param {Object} [bufferEntity=null] - Buffer Entity
   * @param {number} [wavelengthNm=254] - Detector wavelength
   */
  static evaluateSolution(compound, kNeutral, pH, bufferEntity = null, wavelengthNm = 254) {
    const ionization = calculateObservedRetentionFactor(compound, kNeutral, pH);
    const bufferValidation = validateBufferSystem(bufferEntity, pH, wavelengthNm);
    const noiseMultiplier = getBufferNoiseMultiplier(bufferEntity, wavelengthNm);

    return {
      kObserved: ionization.kObserved,
      alphaNeutral: ionization.alphaNeutral,
      alphaIonized: ionization.alphaIonized,
      explanation: ionization.explanation,
      warnings: bufferValidation.warnings,
      bufferExplanations: bufferValidation.explanations,
      noiseMultiplier
    };
  }
}
