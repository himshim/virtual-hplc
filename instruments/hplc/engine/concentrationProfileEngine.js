import { TransportEngine } from './transportEngine.js';
import { BandProfileEngine } from './bandProfileEngine.js';

/**
 * concentrationProfileEngine.js - Time-Dependent Species Concentration Profile Engine
 * 
 * Implements standard BaseEngine interface.
 * Converts chemical species speciation & retention into physical concentration profiles c_i(t)
 * supporting both ideal Gaussian and Exponentially Modified Gaussian (EMG) peak tailing.
 */
export class ConcentrationProfileEngine {
  static metadata = {
    name: "ConcentrationProfileEngine",
    version: "1.1.0",
    apiVersion: 1,
    supports: ["gaussianConcentration", "emgTailing", "multiSpeciesProfiles", "physicalBroadening"]
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
    const bandProfileEngine = new BandProfileEngine();
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
      const tailingFactor = spec.tailingFactor || 1.0;

      const normHeight = (spec.concentration || 1.0) / (sigma * Math.sqrt(2.0 * Math.PI));

      // Calculate instantaneous band concentration c_i(t) via BandProfileEngine
      const profilePatch = bandProfileEngine.process({
        time: t,
        tR,
        sigma,
        height: normHeight,
        tailingFactor
      });

      speciesProfiles.push({
        speciesName: spec.compoundName,
        compoundEntity: spec.compoundEntity,
        tR,
        sigma,
        concentration: profilePatch.intensity, // c_i(t)
        profileType: profilePatch.profileType,
        tailingFactor: profilePatch.tailingFactor,
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
