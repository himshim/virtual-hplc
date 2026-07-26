import { TransportEngine } from './transportEngine.js';

/**
 * concentrationProfileEngine.js - Time-Dependent Species Concentration Profile Engine
 * 
 * Implements standard BaseEngine interface.
 * Converts chemical species speciation & retention into time-dependent concentration profiles c_i(t).
 * 
 * Formula:
 * c_i(t) = (mass_i / (flowRate * sigma_i * sqrt(2*pi))) * exp( -(t - tR_i)^2 / (2 * sigma_i^2) )
 */
export class ConcentrationProfileEngine {
  static metadata = {
    name: "ConcentrationProfileEngine",
    version: "1.0.0",
    apiVersion: 1,
    supports: ["gaussianConcentration", "multiSpeciesProfiles", "physicalBroadening"]
  };

  validate(context) {
    const flowRate = context.flowRate || 1.0;
    if (flowRate <= 0) {
      return { valid: false, errors: ["Flow rate must be greater than zero."] };
    }
    return { valid: true, errors: [] };
  }

  /**
   * Processes species distribution to compute physical concentration profiles c_i(t).
   * @param {Object} context - Read-only SimulationContext
   * @returns {Object} Context patch with speciesProfiles array
   */
  process(context) {
    const t = context.time !== undefined ? context.time : 0.0;
    const speciesDist = context.speciesDistribution || [];
    const flowRate = context.flowRate || 1.0;
    const temperature = context.temperature || 25;
    const columnLengthMm = context.columnLengthMm || 150;

    const transportEngine = new TransportEngine();
    const speciesProfiles = [];

    for (const spec of speciesDist) {
      const tR = spec.tR !== undefined ? spec.tR : 2.5;
      const patch = transportEngine.process({
        tR,
        flowRate,
        temperature,
        columnLengthMm
      });
      const sigma = patch.sigmaTotal;

      // Instantaneous mass transport concentration calculation c_i(t)
      const diff = t - tR;
      const exponent = -(diff * diff) / (2.0 * sigma * sigma);
      const normFactor = (spec.concentration || 1.0) / (sigma * Math.sqrt(2.0 * Math.PI));
      const concentration = Math.max(0, normFactor * Math.exp(exponent));

      speciesProfiles.push({
        speciesName: spec.compoundName,
        compoundEntity: spec.compoundEntity,
        tR,
        sigma,
        concentration, // c_i(t)
        alphaNeutral: spec.alphaNeutral,
        alphaIonized: spec.alphaIonized
      });
    }

    return {
      speciesProfiles
    };
  }

  report(context) {
    return {
      engine: ConcentrationProfileEngine.metadata.name,
      status: "ACTIVE"
    };
  }
}
