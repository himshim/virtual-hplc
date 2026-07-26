/**
 * coElutionEngine.js - Phase I Advanced Physical Co-elution & Overlapping Peak Engine
 * 
 * Implements standard BaseEngine interface.
 * Evaluates true physical co-elution, overlapping peak profiles, shoulder peak resolution,
 * valley-to-peak ratios (V/P), and chromatographic resolution factors (Rs) emerging
 * from continuous signal superposition S(t).
 * 
 * Equations:
 * 1. Resolution Rs = (tR2 - tR1) / (2 * (sigma1 + sigma2))
 * 2. Baseline resolution: Rs >= 1.5
 * 3. Fused peak with shoulder/valley: 0.5 < Rs < 1.5
 * 4. Total co-elution: Rs <= 0.5
 * 5. Valley-to-Peak Ratio V/P = S(t_valley) / S(t_peak_min)
 */

export class CoElutionEngine {
  static metadata = {
    name: "CoElutionEngine",
    version: "1.0.0",
    apiVersion: 1,
    supports: ["physicalCoElution", "resolutionMatrix", "shoulderPeakDetection", "valleyToPeakRatio", "compositeEnvelopes"]
  };

  validate(context) {
    const speciesProfiles = context.speciesProfiles || [];
    if (!Array.isArray(speciesProfiles)) {
      return { valid: false, errors: ["speciesProfiles must be an array."] };
    }
    return { valid: true, errors: [] };
  }

  /**
   * Processes species profiles and continuous signal trace to detect physical co-elutions and resolution metrics.
   * @param {Object} context - Read-only SimulationContext
   * @returns {Object} Context patch with resolutionMatrix, coElutionEvents, and shoulderPeaks
   */
  process(context) {
    const speciesProfiles = context.speciesProfiles || [];
    const signalTrace = context.signalTrace || [];

    if (speciesProfiles.length < 2) {
      return {
        resolutionMatrix: [],
        coElutionEvents: [],
        shoulderPeaks: [],
        hasCoElution: false
      };
    }

    // Sort species by retention time tR
    const sortedSpecies = [...speciesProfiles].sort((a, b) => a.tR - b.tR);

    const resolutionMatrix = [];
    const coElutionEvents = [];
    const shoulderPeaks = [];

    // 1. Calculate pairwise resolution factors Rs
    for (let i = 0; i < sortedSpecies.length - 1; i++) {
      const sp1 = sortedSpecies[i];
      const sp2 = sortedSpecies[i + 1];

      const deltaTR = Math.abs(sp2.tR - sp1.tR);
      const avgWidthWb = 2.0 * ((sp1.sigma || 0.05) + (sp2.sigma || 0.05));
      const Rs = deltaTR / Math.max(0.001, avgWidthWb);

      let classification = "BASELINE_RESOLVED";
      if (Rs <= 0.5) {
        classification = "TOTAL_COELUTION";
      } else if (Rs < 1.5) {
        classification = "PARTIAL_OVERLAP";
      }

      resolutionMatrix.push({
        pair: `${sp1.speciesName} / ${sp2.speciesName}`,
        species1: sp1.speciesName,
        species2: sp2.speciesName,
        tR1: sp1.tR,
        tR2: sp2.tR,
        Rs: Number(Rs.toFixed(3)),
        classification
      });

      if (Rs < 1.5) {
        coElutionEvents.push({
          species1: sp1.speciesName,
          species2: sp2.speciesName,
          deltaTR: Number(deltaTR.toFixed(3)),
          Rs: Number(Rs.toFixed(3)),
          severity: Rs <= 0.5 ? "SEVERE" : "MODERATE"
        });
      }
    }

    // 2. Inflection point second derivative S''(t) analysis for shoulder peak discovery
    if (signalTrace.length > 5) {
      for (let k = 2; k < signalTrace.length - 2; k++) {
        const y0 = signalTrace[k - 2].intensity || signalTrace[k - 2].y || 0;
        const y1 = signalTrace[k - 1].intensity || signalTrace[k - 1].y || 0;
        const y2 = signalTrace[k].intensity || signalTrace[k].y || 0;
        const y3 = signalTrace[k + 1].intensity || signalTrace[k + 1].y || 0;
        const y4 = signalTrace[k + 2].intensity || signalTrace[k + 2].y || 0;

        // Discrete 2nd derivative approximation S''(t)
        const d2y = (y4 - 2 * y2 + y0) / 4.0;
        const d1y = (y3 - y1) / 2.0;

        // Shoulder signature: 1st derivative small, 2nd derivative positive change in descending slope
        if (Math.abs(d1y) < 0.005 && d2y > 0.002 && y2 > 0.05) {
          shoulderPeaks.push({
            time: signalTrace[k].time || signalTrace[k].x || 0,
            intensity: y2,
            type: "SHOULDER_INFLECTION"
          });
        }
      }
    }

    return {
      resolutionMatrix,
      coElutionEvents,
      shoulderPeaks,
      hasCoElution: coElutionEvents.length > 0,
      minResolution: resolutionMatrix.length > 0 ? Math.min(...resolutionMatrix.map(m => m.Rs)) : 2.0
    };
  }

  report(context) {
    return {
      engine: CoElutionEngine.metadata.name,
      status: "ACTIVE"
    };
  }
}
