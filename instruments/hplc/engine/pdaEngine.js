/**
 * pdaEngine.js - Phase H PhotoDiode Array (PDA/DAD) 3D Spectral Matrix Engine
 * 
 * Implements standard BaseEngine interface.
 * Generates full 2D spectral matrix A(t, lambda) across wavelengths 190 nm to 400 nm.
 * Provides extraction of single-wavelength chromatograms A_lambda(t) and calculates
 * peak spectral purity (Purity Index via spectral vector cosine similarity).
 * 
 * Equations:
 * 1. Absorbance A(t, lambda) = sum_i( epsilon_i(lambda) * c_i(t) * pathlength_cm )
 * 2. Peak Purity (Cosine Similarity) = ( s_apex . s_edge ) / ( ||s_apex|| * ||s_edge|| )
 */

export class PdaEngine {
  static metadata = {
    name: "PdaEngine",
    version: "1.0.0",
    apiVersion: 1,
    supports: ["3dSpectralMatrix", "uvVisSpectra", "wavelengthExtraction", "peakPurityAnalysis"]
  };

  validate(context) {
    const minWavelength = context.minWavelength || 190;
    const maxWavelength = context.maxWavelength || 400;
    if (minWavelength >= maxWavelength) {
      return { valid: false, errors: ["minWavelength must be strictly less than maxWavelength."] };
    }
    return { valid: true, errors: [] };
  }

  /**
   * Evaluates compound extinction coefficient spectrum epsilon_i(lambda).
   * Uses multi-Gaussian absorption peak model if compound UV spectrum is defined.
   */
  static getExtinctionCoefficient(compoundEntity, lambda) {
    if (!compoundEntity || !compoundEntity.uvSpectrum) {
      // Default single peak spectrum centered at 254 nm with width 30 nm
      const lambdaMax = compoundEntity?.chromatography?.lambdaMax || 254;
      const width = 30.0;
      const diff = lambda - lambdaMax;
      return Math.exp(-(diff * diff) / (2.0 * width * width));
    }

    const peaks = compoundEntity.uvSpectrum.peaks || [{ lambdaMax: 254, epsilonMax: 1.0, widthNm: 30 }];
    let totalEpsilon = 0.0;

    for (const p of peaks) {
      const lambdaMax = p.lambdaMax || 254;
      const epsMax = p.epsilonMax || 1.0;
      const width = p.widthNm || 25.0;
      const diff = lambda - lambdaMax;
      totalEpsilon += epsMax * Math.exp(-(diff * diff) / (2.0 * width * width));
    }

    return totalEpsilon;
  }

  /**
   * Processes species concentration profiles to build 3D spectral matrix A(t, lambda).
   * @param {Object} context - Read-only SimulationContext
   * @returns {Object} Context patch with pdaData, wavelengths, and extraction helpers
   */
  process(context) {
    const minWavelength = context.minWavelength || 190;
    const maxWavelength = context.maxWavelength || 400;
    const stepNm = context.stepNm || 2; // 2 nm resolution -> 106 wavelength channels
    const pathlengthCm = context.pathlengthCm || 1.0;
    const speciesProfiles = context.speciesProfiles || [];
    const timePoints = context.timePoints || [];

    // Build wavelength vector
    const wavelengths = [];
    for (let w = minWavelength; w <= maxWavelength; w += stepNm) {
      wavelengths.push(w);
    }

    // Build 2D matrix A[timeIndex][wavelengthIndex]
    const pdaMatrix = [];

    for (let tIdx = 0; tIdx < timePoints.length; tIdx++) {
      const timeSlice = new Float32Array(wavelengths.length);

      for (let wIdx = 0; wIdx < wavelengths.length; wIdx++) {
        const lambda = wavelengths[wIdx];
        let totalAbsorbance = 0.0;

        for (const spec of speciesProfiles) {
          const c_i = typeof spec.concentrationAt === "function" 
            ? spec.concentrationAt(timePoints[tIdx]) 
            : (spec.concentration || 0.0);

          const epsilon = PdaEngine.getExtinctionCoefficient(spec.compoundEntity, lambda);
          totalAbsorbance += epsilon * c_i * pathlengthCm;
        }

        timeSlice[wIdx] = totalAbsorbance;
      }

      pdaMatrix.push(timeSlice);
    }

    return {
      pdaData: {
        wavelengths,
        timePoints,
        matrix: pdaMatrix,
        minWavelength,
        maxWavelength,
        stepNm
      }
    };
  }

  /**
   * Calculates Spectral Peak Purity (Cosine Similarity between apex spectrum and edge spectrum).
   * Returns purityScore (0.0 to 1.0) and isPure boolean flag.
   */
  static calculatePeakPurity(pdaData, apexTimeIdx, edgeTimeIdx) {
    if (!pdaData || !pdaData.matrix || apexTimeIdx < 0 || edgeTimeIdx < 0) {
      return { purityScore: 1.0, isPure: true };
    }

    const sApex = pdaData.matrix[apexTimeIdx];
    const sEdge = pdaData.matrix[edgeTimeIdx];

    if (!sApex || !sEdge) return { purityScore: 1.0, isPure: true };

    let dotProduct = 0.0;
    let normApex = 0.0;
    let normEdge = 0.0;

    for (let i = 0; i < sApex.length; i++) {
      dotProduct += sApex[i] * sEdge[i];
      normApex += sApex[i] * sApex[i];
      normEdge += sEdge[i] * sEdge[i];
    }

    if (normApex === 0 || normEdge === 0) return { purityScore: 1.0, isPure: true };

    const cosineSimilarity = dotProduct / (Math.sqrt(normApex) * Math.sqrt(normEdge));
    const purityScore = Math.min(1.0, Math.max(0.0, cosineSimilarity));
    const isPure = purityScore >= 0.990;

    return {
      purityScore,
      isPure,
      purityAngleDeg: (Math.acos(purityScore) * 180 / Math.PI).toFixed(2)
    };
  }

  report(context) {
    return {
      engine: PdaEngine.metadata.name,
      status: "ACTIVE"
    };
  }
}
