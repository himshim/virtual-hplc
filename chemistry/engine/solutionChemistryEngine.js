import { validateBufferSystem, getBufferNoiseMultiplier } from './bufferEngine.js';
import { calculateObservedRetentionFactor } from './ionizationEngine.js';

/**
 * solutionChemistryEngine.js - Phase B Solution Chemistry Speciation Engine
 * 
 * Implements standard BaseEngine interface.
 * Consumes: sampleEntity, pH, bufferEntity, wavelengthNm, temperature.
 * Produces: speciesDistribution [{ compound, kObserved, alphaNeutral, alphaIonized, explanation }],
 *           bufferWarnings, bufferExplanations, noiseMultiplier.
 */
export class SolutionChemistryEngine {
  static metadata = {
    name: "SolutionChemistryEngine",
    version: "2.0.0",
    apiVersion: 1,
    supports: ["speciation", "hendersonHasselbalch", "compositeRetention", "bufferValidation"]
  };

  /**
   * Validates solution chemistry parameters.
   * @param {Object} context - Read-only SimulationContext
   */
  validate(context) {
    const pH = context.pH !== undefined ? context.pH : 7.0;
    const errors = [];
    if (pH < 1.0 || pH > 14.0) {
      errors.push("Mobile phase pH must be between 1.0 and 14.0.");
    }
    return { valid: errors.length === 0, errors };
  }

  /**
   * Processes chemical speciation and buffer validation for a sample mixture.
   * @param {Object} context - Read-only SimulationContext
   * @returns {Object} Context patch with speciesDistribution & buffer metadata
   */
  process(context) {
    const sampleEntity = context.sampleEntity;
    const pH = context.pH !== undefined ? context.pH : 7.0;
    const bufferEntity = context.bufferEntity || null;
    const wavelengthNm = context.wavelengthNm || 254;

    const components = sampleEntity && Array.isArray(sampleEntity.components)
      ? sampleEntity.components
      : (sampleEntity ? [{ compound: sampleEntity, concentration: 1.0 }] : []);

    const speciesDistribution = [];
    const educationalExplanations = [];
    let bufferWarnings = [];
    let bufferExplanations = [];
    let noiseMultiplier = 1.0;

    for (const compDef of components) {
      const compound = compDef.compound;
      if (!compound || !compound.chromatography) continue;

      const kNeutral = context.kNeutral || 5.0; // Baseline un-ionized k
      const ionization = calculateObservedRetentionFactor(compound, kNeutral, pH);

      speciesDistribution.push({
        compoundName: compound.name,
        compoundEntity: compound,
        concentration: compDef.concentration || 1.0,
        kObserved: ionization.kObserved,
        alphaNeutral: ionization.alphaNeutral,
        alphaIonized: ionization.alphaIonized,
        explanation: ionization.explanation
      });

      if (ionization.explanation) {
        educationalExplanations.push(ionization.explanation);
      }
    }

    if (bufferEntity) {
      const bufferVal = validateBufferSystem(bufferEntity, pH, wavelengthNm);
      bufferWarnings = bufferVal.warnings;
      bufferExplanations = bufferVal.explanations;
      noiseMultiplier = getBufferNoiseMultiplier(bufferEntity, wavelengthNm);
    }

    return {
      speciesDistribution,
      educationalExplanations,
      bufferWarnings,
      bufferExplanations,
      noiseMultiplier
    };
  }

  /**
   * Static helper facade for backwards compatibility with legacy calls.
   */
  static evaluateSolution(compound, kNeutral, pH, bufferEntity = null, wavelengthNm = 254) {
    const engine = new SolutionChemistryEngine();
    const patch = engine.process({
      sampleEntity: { components: [{ compound, concentration: 1.0 }] },
      kNeutral,
      pH,
      bufferEntity,
      wavelengthNm
    });

    const spec = patch.speciesDistribution[0] || {};
    return {
      kObserved: spec.kObserved || kNeutral,
      alphaNeutral: spec.alphaNeutral || 1.0,
      alphaIonized: spec.alphaIonized || 0.0,
      explanation: spec.explanation || "",
      warnings: patch.bufferWarnings,
      bufferExplanations: patch.bufferExplanations,
      noiseMultiplier: patch.noiseMultiplier
    };
  }

  report(context) {
    return {
      engine: SolutionChemistryEngine.metadata.name,
      status: "ACTIVE"
    };
  }
}
